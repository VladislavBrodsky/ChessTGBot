import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { CreativeStudio } from "@/components/creatives/CreativeStudio";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Creatives Studio — Build Web3Chess Campaign Graphics",
  "Create branded Web3Chess graphics for square, portrait, story, and wide canvases. Edit the words, place 3D chess artwork, and export a full-size PNG.",
  "/CREATIVES",
  ["Web3Chess creative studio", "chess social media graphics", "chess campaign canvas"],
  "https://web3chess.online/opengraph-image",
);

export default function CreativesPage() {
  return (
    <div>
      <Nav />
      <main id="main" className="shell-wide page-flow">
        <header className="max-w-[780px] pt-6 sm:pt-10">
          <span className="eyebrow">Web3Chess / Creative tools</span>
          <h1 className="poster page-title mt-5">Build the next move</h1>
          <p className="hero-lead mt-5 text-fg-muted">
            A canvas studio for Web3Chess. Pick a format, write your message, arrange
            branded 3D artwork, and download a ready-to-share graphic.
          </p>
        </header>
        <CreativeStudio />
      </main>
      <Footer />
    </div>
  );
}
