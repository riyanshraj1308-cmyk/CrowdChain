import { Search, SlidersHorizontal } from "lucide-react";

const CATEGORIES = ["All", "Infrastructure", "Hardware", "Healthcare", "Agriculture", "Energy", "Education"];
const SORTS = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "ending-soon", label: "Ending Soon" },
  { value: "most-funded", label: "Most Funded" },
];

export default function CampaignFilters({ filters, onChange }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder="Search campaigns by title or keyword…"
            aria-label="Search campaigns"
            className="h-12 w-full rounded-md border border-ink-950/15 bg-paper-50 pl-10 pr-4 text-base text-ink-950 placeholder:text-ink-400 focus:border-copper-500 focus:outline-none focus:shadow-focus"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-ink-400" aria-hidden="true" />
          <select
            value={filters.sort}
            onChange={(e) => onChange({ ...filters, sort: e.target.value })}
            aria-label="Sort campaigns"
            className="h-12 rounded-md border border-ink-950/15 bg-paper-50 px-3 text-sm text-ink-900 focus:border-copper-500 focus:outline-none focus:shadow-focus"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" role="group" aria-label="Filter by category">
        {CATEGORIES.map((cat) => {
          const isActive = filters.category === cat;
          return (
            <button
              key={cat}
              onClick={() => onChange({ ...filters, category: cat })}
              aria-pressed={isActive}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-ink-950 bg-ink-950 text-paper-50"
                  : "border-ink-950/15 text-ink-700 hover:border-ink-950/30"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
