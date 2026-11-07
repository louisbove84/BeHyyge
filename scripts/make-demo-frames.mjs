import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const outDir = path.join(process.cwd(), "public", "demo");

const frames = [
  {
    name: "frame-window.jpg",
    background: "#f3e6df",
    accent: "#7d4b5c",
    title: "Window light",
  },
  {
    name: "frame-linen.jpg",
    background: "#f6f1ea",
    accent: "#6d5c78",
    title: "Linen",
  },
  {
    name: "frame-bloom.jpg",
    background: "#f0d5dc",
    accent: "#8a5364",
    title: "Color study",
  },
  {
    name: "frame-path.jpg",
    background: "#efe2c4",
    accent: "#3c3936",
    title: "Evening",
  },
];

function svg(frame, index) {
  const bands = Array.from({ length: 6 }, (_, band) => {
    const y = 180 + band * 170;
    const opacity = 0.18 + (band % 3) * 0.08;
    return `<rect x="${80 + index * 20}" y="${y}" width="${1040 - index * 30}" height="90" rx="28" fill="${frame.accent}" opacity="${opacity}"/>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
  <rect width="1200" height="1500" fill="${frame.background}"/>
  <rect x="70" y="70" width="1060" height="1360" rx="36" fill="none" stroke="${frame.accent}" stroke-width="8"/>
  ${bands}
  <text x="110" y="1180" fill="${frame.accent}" font-family="Georgia, serif" font-size="92">DEMO</text>
  <text x="110" y="1260" fill="${frame.accent}" font-family="Georgia, serif" font-size="42">${frame.title}</text>
  <text x="110" y="1330" fill="${frame.accent}" font-family="Georgia, serif" font-size="32">Not a client photograph</text>
</svg>`;
}

await mkdir(outDir, { recursive: true });
for (const [index, frame] of frames.entries()) {
  const file = path.join(outDir, frame.name);
  await sharp(Buffer.from(svg(frame, index))).jpeg({ quality: 82 }).toFile(file);
  console.log(frame.name);
}
