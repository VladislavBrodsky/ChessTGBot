import { Eyebrow } from "@/components/ui/Badge";
import { BLOG_POSTS } from "@/content/blog";
import { BlogCard } from "@/components/BlogCard";
import { BlogFeed } from "@/components/BlogFeed";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { Card } from "@/components/ui/Card";
import { buttonClass } from "@/components/ui/Button";
import { SITE } from "@/lib/config";
import { pageMetadata, jsonLd, breadcrumbData } from "@/lib/seo";
import { Icon } from "@/icons";
import { PageHero } from "@/components/PageHero";
import { ChessSculpture } from "@/components/ChessSculpture";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = pageMetadata(
  "Chess Strategy & Training Journal",
  "Explore chess opening ideas, tactical patterns, training advice, and the thinking behind Web3Chess in our chess journal.",
  "/blog",
);
export default function BlogHubPage() {
  const featured = BLOG_POSTS.find((p) => p.featured) || BLOG_POSTS[0];
  const summaries = BLOG_POSTS.map(
    ({
      slug,
      title,
      subtitle,
      excerpt,
      category,
      author,
      readingTime,
      publishedAt,
    }) => ({
      slug,
      title,
      subtitle,
      excerpt,
      category,
      author,
      readingTime,
      publishedAt,
    }),
  );
  return (
    <div>
      <Nav />
      <main
        id="main"
        className="shell-wide space-y-12 py-6 md:space-y-16 md:py-10"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd(breadcrumbData([
              { name: "Home", path: "" },
              { name: "Chess Journal", path: "/blog" },
            ])),
          }}
        />
        <PageHero
          eyebrow="The Web3Chess journal"
          title={
            <>
              Moves worth
              <br />
              reading.
            </>
          }
          lead="Opening ideas, tactical patterns, and a closer look at the game we’re building. Take something useful into your next match."
          visual={<ChessSculpture variant="journal" />}
        >
          <ButtonLink href="#stories" variant="secondary">
            Find your next idea
            <Icon name="arrow-right" size={16} />
          </ButtonLink>
        </PageHero>
        <section aria-label="Featured story">
          <div className="section-index">
            <span>Editor’s pick</span>
            <span>{featured.readingTime}</span>
          </div>
          <BlogCard post={featured} featured />
        </section>
        <section id="stories" aria-labelledby="stories-heading">
          <h2 id="stories-heading" className="editorial-title mb-6">
            Find your next idea.
          </h2>
          <BlogFeed posts={summaries} />
        </section>
        <Card className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Eyebrow>Keep thinking ahead</Eyebrow>
            <h2 className="mt-4 text-heading-sm font-medium">
              Meet us in Telegram.
            </h2>
            <p className="mt-2 max-w-[55ch] text-body text-fg-muted">
              Join the community for chess conversations and updates from
              Web3Chess.
            </p>
          </div>
          <a
            href={SITE.telegramChannel}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("primary", "shrink-0")}
          >
            <Icon name="paper-plane-tilt" size={20} />
            Join the channel
          </a>
        </Card>
      </main>
      <Footer />
      <QrDock />
      <MobileCta />
    </div>
  );
}
