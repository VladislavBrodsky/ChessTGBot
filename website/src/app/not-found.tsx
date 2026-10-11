import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PlayButton } from "@/components/PlayButton";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/icons";

const suggestions: { href: string; title: string; text: string; icon: IconName }[] = [
  { href: "/#challenge", title: "Try a free puzzle", text: "Find the winning move in three positions.", icon: "target" },
  { href: "/academy", title: "Chess Academy", text: "Short lessons on openings, tactics and endgames.", icon: "graduation-cap" },
  { href: "/blog", title: "The journal", text: "Ideas worth taking into your next game.", icon: "book-open-text" },
  { href: "/how-it-works", title: "How it works", text: "From a tap in Telegram to your next rival.", icon: "lightning" },
];

export default function NotFound() {
  return (
    <div>
      <Nav />
      <main id="main" className="shell-wide">
        <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 py-12 text-center sm:py-20" aria-labelledby="not-found-title">
          <span className="eyebrow" aria-hidden="true">404</span>
          <h1 id="not-found-title" className="poster text-heading-xl text-fg">This position doesn&apos;t exist</h1>
          <p className="text-body sm:text-lead text-fg-muted">The page you asked for isn&apos;t on the board.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <PlayButton size="md" />
            <ButtonLink href="/" variant="secondary">
              Back to the website
            </ButtonLink>
          </div>
        </section>
        <section aria-labelledby="not-found-next" className="pb-4">
          <h2 id="not-found-next" className="mb-4 text-title font-medium">Where to next?</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {suggestions.map((item) => (
              <li key={item.href}>
                <Card className="journal-card h-full">
                  <Icon name={item.icon} size={24} />
                  <h3 className="journal-title mt-4 font-medium">
                    <Link href={item.href} className="journal-link">{item.title}</Link>
                  </h3>
                  <p className="mt-2 text-body-sm text-fg-muted">{item.text}</p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}
