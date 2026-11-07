export const GALLERY_KINDS = [
  "family",
  "portrait",
  "milestone",
  "event",
  "team",
  "other",
] as const;

export type GalleryKind = (typeof GALLERY_KINDS)[number];

export const KIND_LABELS: Record<GalleryKind, string> = {
  family: "Family session",
  portrait: "Portrait",
  milestone: "Milestone",
  event: "Gathering",
  team: "Team photo",
  other: "Other",
};

export function isGalleryKind(value: string): value is GalleryKind {
  return (GALLERY_KINDS as readonly string[]).includes(value);
}
