import { home } from "@/content/home";

export function Faq() {
  return (
    <div className="shell-prose">
      {home.faq.map((item) => (
        <details
          key={item.q}
          name="faq"
          className="group border-b border-[#e5e5e5] py-2 last:border-0"
        >
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 text-[17px] sm:text-[18px] font-semibold text-[#000000] marker:hidden">
            {item.q}
            <span
              aria-hidden="true"
              className="text-[#444444] transition-transform duration-150 group-open:rotate-45"
            >
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </span>
          </summary>
          <p className="pb-5 pt-1 text-[15px] sm:text-[16px] leading-[1.4] text-[#444444]">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
