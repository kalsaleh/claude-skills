import Link from "next/link";

const STEPS = [
  { href: "/import", label: "Import" },
  { href: "/filter", label: "Filter" },
  { href: "/enrich", label: "Name them" },
  { href: "/map", label: "Map" },
];

export function BuilderStepper({ current }: { current: "import" | "filter" | "enrich" | "map" }) {
  const index = STEPS.findIndex((step) => step.href === `/${current}` || (current === "map" && step.href === "/map"));
  return (
    <ol className="flex flex-wrap gap-3 text-sm text-mist">
      {STEPS.map((step, i) => {
        const active = step.label === STEPS[index]?.label;
        return (
          <li key={step.href} className={active ? "text-chalk" : ""}>
            <Link href={step.href} className="hover:text-chalk">
              <span className="font-display mr-1">{String(i + 1).padStart(2, "0")}</span>
              {step.label}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
