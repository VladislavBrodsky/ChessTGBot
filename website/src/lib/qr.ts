import QRCode from "qrcode";

/** Renders a QR as an inline SVG string at build time with Dayos pure black modules. */
export async function qrSvg(data: string): Promise<string> {
  return QRCode.toString(data, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#0000" },
  });
}
