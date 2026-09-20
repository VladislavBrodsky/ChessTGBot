import QRCode from "qrcode";

/** Renders a QR as an inline SVG string at build time (no client JS, no image request). */
export async function qrSvg(data: string): Promise<string> {
  return QRCode.toString(data, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#20294C", light: "#0000" },
  });
}
