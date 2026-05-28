import type { GuideBlock, GuideTableBlock } from "@/lib/city-data";

const keyForHeader = (header: string) =>
  header
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

function renderLinkedValue(table: GuideTableBlock, rowIndex: number, header: string) {
  const key = keyForHeader(header);
  const row = table.rows[rowIndex];
  const value = row.values[key] || "";
  const links = row.links[key];

  if (links?.[0]?.url) {
    return (
      <a className="font-semibold text-slate-950 underline" href={links[0].url}>
        {value || links[0].text}
      </a>
    );
  }

  return value;
}

function GuideTable({ table }: { table: GuideTableBlock }) {
  return (
    <div className="my-6 overflow-x-auto border border-slate-200 bg-white">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
          <tr>
            {table.headers.map((header) => (
              <th className="border-b border-slate-200 px-4 py-3 font-semibold" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((_, rowIndex) => (
            <tr className="align-top odd:bg-white even:bg-slate-50" key={`${table.purpose}-${rowIndex}`}>
              {table.headers.map((header) => (
                <td className="max-w-[360px] border-b border-slate-100 px-4 py-3 leading-6 text-slate-700" key={header}>
                  {renderLinkedValue(table, rowIndex, header)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GuideContent({ blocks }: { blocks: GuideBlock[] }) {
  return (
    <div className="guide-content">
      {blocks.map((block, index) => {
        if (block.type === "table") {
          return <GuideTable key={`${block.purpose}-${index}`} table={block} />;
        }

        if (block.style === "Heading 2") {
          return (
            <h2 className="mt-8 max-w-4xl text-2xl font-bold text-slate-950" key={`${block.text}-${index}`}>
              {block.text}
            </h2>
          );
        }

        if (block.style === "Heading 3") {
          return (
            <h3 className="mt-6 max-w-4xl text-xl font-semibold text-slate-950" key={`${block.text}-${index}`}>
              {block.text}
            </h3>
          );
        }

        if (block.style === "List Bullet" || block.style === "List Number") {
          return (
            <p className="mt-3 flex max-w-4xl gap-3 text-base leading-7 text-slate-700" key={`${block.text}-${index}`}>
              <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-700" />
              <span>{block.text}</span>
            </p>
          );
        }

        return (
          <p className="mt-4 max-w-4xl text-base leading-8 text-slate-700" key={`${block.text}-${index}`}>
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
