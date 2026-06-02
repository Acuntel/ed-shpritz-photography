// Generates a QR code (SVG for print + PNG for screens) pointing at the site.
// Usage: node scripts/qr.mjs [url]
// Default URL is the production domain. Re-run with the final URL once live.
import QRCode from "qrcode";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const url = process.argv[2] || "https://edshpritzphotography.com";
const ROOT = process.cwd();
const opts = { margin: 2, color: { dark: "#0b0b0c", light: "#ffffff" } };

const svg = await QRCode.toString(url, { type: "svg", ...opts });
await writeFile(path.join(ROOT, "public/qr-edshpritz.svg"), svg);

await QRCode.toFile(path.join(ROOT, "public/qr-edshpritz.png"), url, {
  width: 1200,
  ...opts,
});

console.log(`qr: wrote public/qr-edshpritz.svg + .png → ${url}`);
