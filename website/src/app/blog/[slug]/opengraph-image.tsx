import { ImageResponse } from "next/og";
import { getBlogPostBySlug, BLOG_POSTS } from "@/content/blog";

export const runtime = "nodejs";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug) || {
    title: "Web3Chess Chronicles",
    category: "Strategy",
    readingTime: "5 min read",
    author: { name: "Web3Chess Team", role: "Tactical Division" },
  };

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#e5e5e5",
          padding: 64,
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: "#000000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: 28,
                fontWeight: 900,
              }}
            >
              ♟
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 26,
                fontWeight: 800,
                color: "#000000",
                letterSpacing: "-0.03em",
                textTransform: "uppercase",
              }}
            >
              WEB3CHESS CHRONICLES
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                backgroundColor: "#d1ffca",
                padding: "8px 20px",
                borderRadius: 40,
                fontSize: 16,
                fontWeight: 700,
                color: "#000000",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {post.category}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 16,
                fontWeight: 600,
                color: "#666666",
              }}
            >
              • {post.readingTime}
            </div>
          </div>
        </div>

        {/* Center Article Title Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#ffffff",
            padding: 48,
            borderRadius: 36,
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 54,
              fontWeight: 900,
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              color: "#000000",
              textTransform: "uppercase",
            }}
          >
            {post.title}
          </div>
        </div>

        {/* Footer Meta Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                backgroundColor: "#000000",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              {post.author.name.charAt(0)}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 18, fontWeight: 700, color: "#000000" }}>
                {post.author.name}
              </div>
              <div style={{ display: "flex", fontSize: 14, fontWeight: 500, color: "#777777" }}>
                {post.author.role}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 18,
                fontWeight: 700,
                color: "#000000",
                backgroundColor: "#fff100",
                padding: "8px 16px",
                borderRadius: 8,
              }}
            >
              @chess_matbot
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 18,
                fontWeight: 800,
                color: "#979797",
                letterSpacing: "0.05em",
              }}
            >
              WEB3CHESS.ONLINE
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
