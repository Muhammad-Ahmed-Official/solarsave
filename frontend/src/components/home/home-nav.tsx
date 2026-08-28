import Link from "next/link";

export function HomeNav() {
  return (
    <nav className="flex h-14 items-center gap-4 px-2 sm:px-3">
      <Link href="/" className="flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-white shadow-[0_6px_18px_-10px_rgba(93,76,38,0.4)]">
          <span
            className="size-4 rounded-full white-background"
            style={{
              background:
                "linear-gradient(135deg, #f2c94c 0%, #efb04c 48%, #8fc46f 100%)",
            }}
          />
        </span>
        <span className="text-[18px] font-normal tracking-[-0.02em] text-[#5f5b52]">
          Solar Save
        </span>
      </Link>
    </nav>
  );
}
