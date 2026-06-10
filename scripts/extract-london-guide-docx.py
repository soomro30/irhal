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


SECTION_MAP = {
    "1. Visitor Information": "visitor-information",
    "2. Festivals and Annual Events": "festivals-and-annual-events",
    "3. Transportation and Getting Around": "transportation-and-getting-around",
    "4. City Information": "city-information",
    "5. Hotels": "hotels",
    "6. Places to Visit": "places-to-visit",
    "7. Shopping": "shopping",
    "8. Organized Tours": "organized-tours",
    "9. Health and Safety": "health-and-safety",
    "10. City in a Day and Multi-Day Routes": "city-in-a-day-and-longer-itineraries",
    "11. What to do with Children in Tow": "children-in-tow",
    "12. Muslim Visitor Information: Halal Dining": "food-and-restaurants",
    "13. Muslim Visitor Information: Masjids and Prayer Spaces": "muslim-visitor-information",
    "14. Enterprise Update Workflow for Irhal Editors": "data-resources-and-update-workflow",
}

REQUIRED_SECTION_SLUGS = [
    "visitor-information",
    "festivals-and-annual-events",
    "transportation-and-getting-around",
    "city-information",
    "neighborhood-operating-guide",
    "hotels",
    "places-to-visit",
    "shopping",
    "food-and-restaurants",
    "organized-tours",
    "health-and-safety",
    "city-in-a-day-and-longer-itineraries",
    "children-in-tow",
    "muslim-visitor-information",
    "data-resources-and-update-workflow",
]

DIRECTORY_SECTION_KINDS = {
    "hotels": "hotel",
    "places-to-visit": "place",
    "shopping": "shopping",
    "organized-tours": "tour",
    "children-in-tow": "family",
    "food-and-restaurants": "restaurant",
    "muslim-visitor-information": "masjid",
}

SECTION_TITLES = {
    "visitor-information": "Visitor Information",
    "festivals-and-annual-events": "Festivals and Annual Events",
    "transportation-and-getting-around": "Transportation and Getting Around",
    "city-information": "City Information",
    "neighborhood-operating-guide": "Neighborhood Operating Guide",
    "hotels": "Hotels",
    "places-to-visit": "Places to Visit",
    "shopping": "Shopping",
    "food-and-restaurants": "Food and Restaurants",
    "organized-tours": "Organized Tours",
    "health-and-safety": "Health and Safety",
    "city-in-a-day-and-longer-itineraries": "City in a Day and Multi-Day Routes",
    "children-in-tow": "What to do with Children in Tow",
    "muslim-visitor-information": "Muslim Visitor Information: Masjids and Prayer Spaces",
    "data-resources-and-update-workflow": "Enterprise Update Workflow for Irhal Editors",
}

SECTION_SUMMARIES = {
    "visitor-information": "Visa, ETA, exchange, public holiday, climate, and fast-fact guidance for London visitors.",
    "festivals-and-annual-events": "Month-by-month London events and seasonal planning notes for Muslim and family travellers.",
    "transportation-and-getting-around": "Practical movement advice for the Underground, Elizabeth line, buses, rail, taxis, airports, and driving.",
    "city-information": "London's civic identity, history, resident culture, and Muslim-travel context.",
    "neighborhood-operating-guide": "Borough-level live discovery layers for halal restaurants, masjids, and prayer rooms across Greater London.",
    "hotels": "Location-led London hotel leads across luxury, upscale, budget, and serviced-apartment categories.",
    "places-to-visit": "Major landmarks, museums, royal parks, heritage districts, viewpoints, and cultural sights.",
    "shopping": "Luxury retail, high streets, markets, Muslim shopping corridors, and family-friendly shopping districts.",
    "food-and-restaurants": "Halal dining clusters, certified leads, Muslim-friendly food districts, and restaurant verification notes.",
    "organized-tours": "Self-guided and guided routes that reduce transport friction and add cultural context.",
    "health-and-safety": "Emergency, NHS, pharmacy, accessibility, weather, crowd, and practical safety notes.",
    "city-in-a-day-and-longer-itineraries": "First-day, Muslim heritage, family, shopping, museum, and multi-day London route ideas.",
    "children-in-tow": "Child-friendly museums, parks, playgrounds, transport attractions, and family planning notes.",
    "muslim-visitor-information": "Major masjids, prayer-space leads, Tower Hamlets mosque-directory coverage, and verification requirements.",
    "data-resources-and-update-workflow": "Source layers, editorial QA, halal verification, mosque verification, image policy, and update rhythm.",
}

SECTION_TYPES = {
    "visitor-information": "editorial",
    "festivals-and-annual-events": "editorial",
    "transportation-and-getting-around": "editorial",
    "city-information": "editorial",
    "neighborhood-operating-guide": "locator",
    "hotels": "directory",
    "places-to-visit": "directory",
    "shopping": "directory",
    "food-and-restaurants": "directory",
    "organized-tours": "directory",
    "health-and-safety": "editorial",
    "city-in-a-day-and-longer-itineraries": "mixed",
    "children-in-tow": "directory",
    "muslim-visitor-information": "directory",
    "data-resources-and-update-workflow": "editorial",
}


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:90] or "item"


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


def table_payload(table: Table, index: int, purpose: str) -> dict[str, Any]:
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
        "purpose": purpose,
        "headers": headers,
        "rows": rows,
    }


def clean_heading_number(text: str) -> str:
    return re.sub(r"^\d+\.\s+", "", text).strip()


def area_and_type(text: str) -> tuple[str, str] | None:
    match = re.match(r"^Area:\s*(.*?)\s+Type:\s*(.+)$", text)
    if not match:
        return None
    return match.group(1).strip(), match.group(2).strip()


def linked_url(block: dict[str, Any]) -> str:
    for link in block.get("links", []):
        if link.get("url"):
            return link["url"]
    return ""


def make_item(
    *,
    city_slug: str,
    current_item: dict[str, Any],
    kind: str,
    section_slug: str,
    slug: str,
) -> dict[str, Any]:
    paragraphs = current_item["paragraphs"]
    meta = area_and_type(paragraphs[0]["text"]) if paragraphs else None
    area = meta[0] if meta else "London"
    category = meta[1] if meta else kind.title()
    body_blocks = paragraphs[1:-1] if len(paragraphs) >= 2 else paragraphs
    map_block = paragraphs[-1] if paragraphs else {}
    map_url = linked_url(map_block)
    overview = [block["text"] for block in body_blocks if block.get("text")]
    summary = overview[0] if overview else f"{current_item['title']} in London."
    title = current_item["title"]
    source_note = map_block.get("text", "")

    return {
        "id": f"{kind}:{slug}",
        "citySlug": city_slug,
        "kind": kind,
        "sectionSlug": section_slug,
        "sourceTable": section_slug,
        "sourceRowId": current_item["sourceRowId"],
        "title": title,
        "slug": slug,
        "eyebrow": f"{category} in {area}",
        "area": area,
        "category": category,
        "description": summary,
        "mapUrl": map_url,
        "imageAlt": f"{title}, London",
        "details": {
            "area": area,
            "category": category,
            "sourceNote": source_note,
            "subsection": current_item.get("subsection") or "",
        },
        "originalContent": overview,
        "geoStatus": "provider-enrichment-required",
    }


def make_article(title: str, blocks: list[dict[str, Any]]) -> dict[str, Any]:
    summary = next((block["text"] for block in blocks if block.get("type") == "paragraph" and block.get("style") == "Normal"), "")
    return {
        "title": title,
        "slug": slugify(title),
        "summary": summary,
        "blocks": blocks,
    }


def build_neighborhood_section(tables: list[dict[str, Any]]) -> dict[str, Any]:
    borough_table = next((table for table in tables if table["purpose"] == "borough_live_discovery"), None)
    blocks: list[dict[str, Any]] = [
        {
            "type": "paragraph",
            "style": "Normal",
            "text": SECTION_SUMMARIES["neighborhood-operating-guide"],
            "links": [],
        }
    ]
    if borough_table:
        blocks.append(borough_table)

    return {
        "title": SECTION_TITLES["neighborhood-operating-guide"],
        "slug": "neighborhood-operating-guide",
        "summary": SECTION_SUMMARIES["neighborhood-operating-guide"],
        "sectionType": SECTION_TYPES["neighborhood-operating-guide"],
        "blocks": blocks,
        "articles": [make_article("London borough live discovery layer", blocks)],
    }


def build_guide(docx_path: Path) -> dict[str, Any]:
    doc = Document(docx_path)
    intro_blocks: list[dict[str, Any]] = []
    sections_by_slug: dict[str, dict[str, Any]] = {}
    guide_items: list[dict[str, Any]] = []
    itineraries: list[dict[str, Any]] = []
    item_slug_counts: dict[str, int] = {}
    tables: list[dict[str, Any]] = []
    current_section: dict[str, Any] | None = None
    current_article_title: str | None = None
    current_article_blocks: list[dict[str, Any]] = []
    current_item: dict[str, Any] | None = None
    current_subsection: str | None = None
    table_index = 0

    def flush_article() -> None:
        nonlocal current_article_title, current_article_blocks
        if current_section and current_article_title and current_article_blocks:
            current_section["articles"].append(
                make_article(current_article_title, current_article_blocks)
            )
        current_article_title = None
        current_article_blocks = []

    def flush_item() -> None:
        nonlocal current_item
        if not current_section or not current_item:
            current_item = None
            return
        slug = current_section["slug"]
        if slug == "city-in-a-day-and-longer-itineraries":
            paragraphs = current_item["paragraphs"]
            overview = [block["text"] for block in paragraphs[1:-1] if block.get("text")]
            summary = overview[0] if overview else f"{current_item['title']} route in London."
            itineraries.append(
                {
                    "title": current_item["title"],
                    "slug": slugify(current_item["title"]),
                    "durationDays": 1,
                    "audience": "muslim-traveler" if "muslim" in current_item["title"].lower() else "first-time",
                    "summary": summary,
                    "days": [
                        {
                            "dayNumber": 1,
                            "theme": current_item["title"],
                            "routeNotes": summary,
                            "stops": [],
                        }
                    ],
                }
            )
        else:
            kind = DIRECTORY_SECTION_KINDS.get(slug)
            if kind:
                base_slug = slugify(current_item["title"])
                slug_key = f"{kind}:{base_slug}"
                item_slug_counts[slug_key] = item_slug_counts.get(slug_key, 0) + 1
                unique_slug = (
                    base_slug
                    if item_slug_counts[slug_key] == 1
                    else f"{base_slug}-{item_slug_counts[slug_key]}"
                )
                guide_items.append(
                    make_item(
                        city_slug="london",
                        current_item=current_item,
                        kind=kind,
                        section_slug=slug,
                        slug=unique_slug,
                    )
                )
        current_item = None

    for block in iter_blocks(doc):
        if isinstance(block, Paragraph):
            payload = paragraph_payload(block)
            if not payload:
                continue

            text = payload["text"]
            style = payload["style"]
            if style == "Heading 1" and text in SECTION_MAP:
                flush_item()
                flush_article()
                slug = SECTION_MAP[text]
                current_section = {
                    "title": SECTION_TITLES[slug],
                    "slug": slug,
                    "summary": SECTION_SUMMARIES[slug],
                    "sectionType": SECTION_TYPES[slug],
                    "blocks": [],
                    "articles": [],
                }
                sections_by_slug[slug] = current_section
                current_article_title = SECTION_TITLES[slug]
                current_article_blocks = []
                current_subsection = None
                continue

            if current_section is None:
                intro_blocks.append(payload)
                continue

            section_slug = current_section["slug"]
            is_directory = section_slug in DIRECTORY_SECTION_KINDS or section_slug == "city-in-a-day-and-longer-itineraries"
            numbered_heading = style == "Heading 3" and re.match(r"^\d+\.\s+", text)

            if is_directory and numbered_heading:
                flush_item()
                current_item = {
                    "title": clean_heading_number(text),
                    "sourceRowId": f"{section_slug}:{len(guide_items) + len(itineraries) + 1}",
                    "subsection": current_subsection,
                    "paragraphs": [],
                }
                continue

            if is_directory and style == "Heading 2":
                flush_item()
                current_subsection = text
                current_section["blocks"].append(payload)
                current_article_blocks.append(payload)
                continue

            if is_directory and current_item:
                current_item["paragraphs"].append(payload)
                continue

            if style in {"Heading 2", "Heading 3"}:
                flush_article()
                current_article_title = clean_heading_number(text)
                current_article_blocks = []
                current_section["blocks"].append(payload)
                continue

            current_section["blocks"].append(payload)
            current_article_blocks.append(payload)

        elif isinstance(block, Table):
            purpose = {
                0: "editorial_promise",
                1: "fast_facts",
                2: "public_holidays",
                3: "climate",
                4: "halal_verification_standard",
                5: "live_map_layers_note",
                6: "borough_live_discovery",
                7: "prayer_space_verification_standard",
            }.get(table_index, f"table_{table_index}")
            payload = table_payload(block, table_index, purpose)
            tables.append(payload)
            table_index += 1
            if current_section is None:
                intro_blocks.append(payload)
            else:
                current_section["blocks"].append(payload)
                current_article_blocks.append(payload)

    flush_item()
    flush_article()

    sections_by_slug["neighborhood-operating-guide"] = build_neighborhood_section(tables)
    sections = [sections_by_slug[slug] for slug in REQUIRED_SECTION_SLUGS if slug in sections_by_slug]

    fast_facts_table = next((table for table in tables if table["purpose"] == "fast_facts"), None)
    fast_facts = []
    if fast_facts_table:
        for row in fast_facts_table["rows"]:
            values = row["values"]
            item = values.get("item")
            detail = values.get("detail")
            if item and detail:
                fast_facts.append({"label": item, "value": detail})

    return {
        "source": {
            "fileName": docx_path.name,
            "extractedAt": "2026-06-10",
            "formatVersion": "irhal-london-city-guide-import-v1",
        },
        "city": {
            "name": "London",
            "slug": "london",
            "country": "United Kingdom",
            "region": "Greater London, England",
            "updatedLabel": "29 May 2026",
            "lede": next(
                (
                    block["text"]
                    for block in intro_blocks
                    if block.get("type") == "paragraph"
                    and "London is a world capital" in block.get("text", "")
                ),
                "London is a world capital of monarchy, museums, theatre, finance, parks, migration and faith, with one of Europe's strongest Islamic city-break ecosystems.",
            ),
        },
        "introBlocks": intro_blocks,
        "sections": sections,
        "tables": tables,
        "guideItems": guide_items,
        "itineraries": itineraries,
        "fastFacts": fast_facts,
        "coverage": {
            "sectionCount": len(sections),
            "guideItemCount": len(guide_items),
            "itineraryCount": len(itineraries),
            "tableCount": len(tables),
            "requiredSectionSlugs": REQUIRED_SECTION_SLUGS,
            "missingRequiredSectionSlugs": [
                slug for slug in REQUIRED_SECTION_SLUGS if slug not in {section["slug"] for section in sections}
            ],
            "guideItemCountsByKind": {
                kind: len([item for item in guide_items if item["kind"] == kind])
                for kind in sorted(set(item["kind"] for item in guide_items))
            },
        },
    }


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: extract-london-guide-docx.py input.docx output.json")

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    guide = build_guide(input_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(guide, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(guide["coverage"], indent=2))


if __name__ == "__main__":
    main()
