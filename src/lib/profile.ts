export const STUDIO_NAME = "Be Hygge Photography";
export const STUDIO_PLACE = "Wisconsin";
export const STUDIO_PHOTOGRAPHER = "Brittany";
export const STUDIO_MOTTO =
  "Hygge (hoo-gah): a Danish concept of warmth, connection, and finding beauty in life\u2019s simple moments.";
export const INSTAGRAM_URL = "https://www.instagram.com/behyggephotography/";

export type StudioMode = "preview" | "open";

export function studioMode(value: string | undefined): StudioMode {
  return value?.trim().toLowerCase() === "open" ? "open" : "preview";
}
