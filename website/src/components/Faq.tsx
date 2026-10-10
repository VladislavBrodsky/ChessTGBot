import { home } from "@/content/home";
import { Icon } from "@/icons";

export function Faq() {
  return (
    <div>
      {home.faq.map((item) => (
        <details
          key={item.q}
          name="faq"
          className="group border-b border-line py-2 last:border-0"
        >
          <summary className="faq-question flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 text-fg marker:hidden">
            {item.q}
            <span
              aria-hidden="true"
              className="shrink-0 text-fg-muted transition-transform duration-150 group-open:rotate-45"
            >
              <Icon name="plus" size={20} />
            </span>
          </summary>
          <p className="pb-5 pt-1 text-body text-fg-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
