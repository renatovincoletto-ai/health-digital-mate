import { Link } from "@tanstack/react-router";

export function BrandMark({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-2.5">
      <span
        aria-hidden
        className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft transition group-hover:scale-105"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          {/* Heart + pulse — a clínica que pulsa */}
          <path
            d="M3.5 11c0-2.8 2.2-5 5-5 1.4 0 2.7.6 3.5 1.5C12.8 6.6 14.1 6 15.5 6c2.8 0 5 2.2 5 5 0 5-6 8.5-9 10.5C8.5 19.5 3.5 16 3.5 11Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 12h2.2l1.4-2.2L11.4 14l1.4-3 1 1.5h3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </span>
      <span className="font-display text-xl font-semibold tracking-tight text-foreground">
        Minha <span className="text-primary">Clínica</span>
      </span>
    </Link>
  );
}
