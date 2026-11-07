import sharp from "sharp";

const DISPLAY_EDGE = 2048;

export async function makeDisplayWebp(input: Buffer) {
  const base = sharp(input, { failOn: "none", limitInputPixels: 80_000_000 }).rotate();
  const metadata = await base.clone().metadata();
  const { data, info } = await base
    .clone()
    .resize({
      width: DISPLAY_EDGE,
      height: DISPLAY_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });

  return {
    bytes: data,
    width: info.width,
    height: info.height,
    sourceWidth: metadata.width ?? info.width,
    sourceHeight: metadata.height ?? info.height,
  };
}
