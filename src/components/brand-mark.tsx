import { Link } from "@tanstack/react-router";

export function BrandMark({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-2.5">
      <span
        aria-hidden
        className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft transition group-hover:scale-105"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M12 3v18M3 12h18M7 7l10 10M17 7L7 17"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.45"
          />
          <circle cx="12" cy="12" r="3.2" fill="currentColor" />
        </svg>
      </span>
      <span className="font-display text-xl font-semibold tracking-tight text-foreground">
        Saúde<span className="text-primary">OS</span>
      </span>
    </Link>
  );
}
