from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

from docx import Document
from docx.document import Document as DocumentObject
from docx.oxml.ns import qn
from docx.table import Table
from docx.text.paragraph import Paragraph


W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"


TABLE_PURPOSES = [
    "fast_facts",
    "public_holidays",
    "climate",
    "festivals",
    "neighborhood_operating_guide",
    "hotels",
    "places_to_visit",
    "live_area_locators_attractions",
    "shopping",
    "food_restaurants",
    "live_restaurant_locators",
    "organized_tours",
    "emergency_numbers",
    "children_in_tow",
    "masjids",
    "live_masjid_locators",
    "map_data_workflow",
]


SECTION_SLUGS = {
    "1. Visitor Information": "visitor-information",
    "2. Festivals and Annual Events": "festivals-and-annual-events",
    "3. Transportation and Getting Around": "transportation-and-getting-around",
    "4. City Information": "city-information",
    "5. Neighborhood Operating Guide": "neighborhood-operating-guide",
    "6. Hotels": "hotels",
    "7. Places to Visit": "places-to-visit",
    "8. Shopping": "shopping",
    "9. Food and Restaurants": "food-and-restaurants",
    "10. Organized Tours": "organized-tours",
    "11. Health and Safety": "health-and-safety",
    "12. City in a Day and Longer Itineraries": "city-in-a-day-and-longer-itineraries",
    "13. What to Do with Children in Tow": "children-in-tow",
    "14. Muslim Visitor Information": "muslim-visitor-information",
    "15. Data Resources and Update Workflow": "data-resources-and-update-workflow",
}


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "item"


def iter_blocks(parent: DocumentObject):
    body = parent.element.body
    for child in body.iterchildren():
        if child.tag == qn("w:p"):
            yield Paragraph(child, parent)
        elif child.tag == qn("w:tbl"):
            yield Table(child, parent)


def paragraph_links(paragraph: Paragraph) -> list[dict[str, str]]:
    links: list[dict[str, str]] = []
    for hyperlink in paragraph._element.findall(f".//{{{W_NS}}}hyperlink"):
        rid = hyperlink.get(f"{{{R_NS}}}id")
        url = paragraph.part.rels[rid].target_ref if rid and rid in paragraph.part.rels else ""
        text = "".join(node.text or "" for node in hyperlink.findall(f".//{{{W_NS}}}t")).strip()
        if url:
            links.append({"text": text or url, "url": url})
    return links


def cell_links(cell) -> list[dict[str, str]]:
    links: list[dict[str, str]] = []
    for paragraph in cell.paragraphs:
        links.extend(paragraph_links(paragraph))
    return links


def paragraph_payload(paragraph: Paragraph) -> dict[str, Any] | None:
    text = " ".join((paragraph.text or "").split())
    if not text:
        return None

    return {
        "type": "paragraph",
        "style": paragraph.style.name,
        "text": text,
        "links": paragraph_links(paragraph),
    }


def table_payload(table: Table, index: int) -> dict[str, Any]:
    rows = []
    headers = [" ".join(cell.text.split()) for cell in table.rows[0].cells]

    for row in table.rows[1:]:
        values = [" ".join(cell.text.split()) for cell in row.cells]
        mapped = {}
        links = {}
        for header, cell, value in zip(headers, row.cells, values):
            key = slugify(header).replace("-", "_")
            mapped[key] = value
            cell_link_values = cell_links(cell)
            if cell_link_values:
                links[key] = cell_link_values
        rows.append({"values": mapped, "links": links})

    return {
        "type": "table",
        "index": index,
        "purpose": TABLE_PURPOSES[index] if index < len(TABLE_PURPOSES) else f"table_{index}",
        "headers": headers,
        "rows": rows,
    }


def build_guide(docx_path: Path) -> dict[str, Any]:
    doc = Document(docx_path)
    table_index = 0
    intro_blocks: list[dict[str, Any]] = []
    sections: list[dict[str, Any]] = []
    current_section: dict[str, Any] | None = None

    for block in iter_blocks(doc):
        if isinstance(block, Paragraph):
            payload = paragraph_payload(block)
            if not payload:
                continue

            is_heading_1 = payload["style"] == "Heading 1"
            if is_heading_1 and payload["text"] in SECTION_SLUGS:
                current_section = {
                    "title": payload["text"],
                    "slug": SECTION_SLUGS[payload["text"]],
                    "blocks": [],
                }
                sections.append(current_section)
                continue

            if current_section is None:
                intro_blocks.append(payload)
            else:
                current_section["blocks"].append(payload)

        elif isinstance(block, Table):
            payload = table_payload(block, table_index)
            table_index += 1
            if current_section is None:
                intro_blocks.append(payload)
            else:
                current_section["blocks"].append(payload)

    tables = [
        block
        for block in intro_blocks + [nested for section in sections for nested in section["blocks"]]
        if block["type"] == "table"
    ]

    return {
        "source": {
            "fileName": docx_path.name,
            "extractedAt": "2026-05-27",
            "formatVersion": "irhal-city-guide-import-v1",
        },
        "city": {
            "name": "Karachi",
            "slug": "karachi",
            "country": "Pakistan",
            "region": "Sindh",
            "updatedLabel": "25 May 2026",
        },
        "introBlocks": intro_blocks,
        "sections": sections,
        "tables": tables,
        "coverage": {
            "sectionCount": len(sections),
            "tableCount": len(tables),
            "requiredSectionSlugs": list(SECTION_SLUGS.values()),
            "missingRequiredSectionSlugs": [
                slug for slug in SECTION_SLUGS.values() if slug not in {section["slug"] for section in sections}
            ],
            "tableRowCounts": {
                table["purpose"]: len(table["rows"])
                for table in tables
            },
        },
    }


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: extract_city_guide_docx.py input.docx output.json")

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    guide = build_guide(input_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(guide, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(json.dumps(guide["coverage"], indent=2))


if __name__ == "__main__":
    main()
