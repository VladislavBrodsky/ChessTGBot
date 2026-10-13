import { Card } from "./ui/Card";
import { Icon } from "@/icons";

export function ShowcaseSkeleton({ kind }: { kind: "globe" | "ecosystem" }) {
  return <Card className="showcase-panel showcase-skeleton" role="status" aria-label={kind === "globe" ? "Loading global arena" : "Loading chess ecosystem"}>
    <div className="showcase-panel-heading"><span>{kind === "globe" ? "Global Arena" : "USDT Settlement · GRAM Blockchain"}</span><span className="showcase-loading-dot" aria-hidden="true" /></div>
    {kind === "globe" && <div className="showcase-loading-match" aria-hidden="true" />}
    <div className="showcase-loading-stage" aria-hidden="true"><div><Icon name={kind === "globe" ? "globe" : "cpu"} size={28} /></div></div>
    <div className="showcase-panel-footer">{kind === "globe" ? "Loading global arena" : "Hover or tap any piece or token to inspect live rails"}</div>
  </Card>;
}
