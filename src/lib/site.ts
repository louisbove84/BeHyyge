import "server-only";
import {
  INSTAGRAM_URL,
  STUDIO_MOTTO,
  STUDIO_NAME,
  STUDIO_PHOTOGRAPHER,
  STUDIO_PLACE,
  studioMode,
  type StudioMode,
} from "@/lib/profile";
import { safeHttpUrl } from "@/lib/urls";

export type SiteInfo = {
  name: string;
  place: string;
  photographer: string;
  motto: string;
  instagramUrl: string;
  mode: StudioMode;
  preview: boolean;
  bookingUrl: string | null;
  contactEmail: string | null;
};

function emailOrNull(value: string | undefined) {
  const email = value?.trim() ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function getSite(): SiteInfo {
  const mode = studioMode(process.env.STUDIO_MODE);
  return {
    name: process.env.STUDIO_NAME?.trim() || STUDIO_NAME,
    place: process.env.STUDIO_PLACE?.trim() || STUDIO_PLACE,
    photographer: process.env.STUDIO_PHOTOGRAPHER?.trim() || STUDIO_PHOTOGRAPHER,
    motto: STUDIO_MOTTO,
    instagramUrl: INSTAGRAM_URL,
    mode,
    preview: mode === "preview",
    bookingUrl: safeHttpUrl(process.env.BOOKING_URL),
    contactEmail: emailOrNull(process.env.CONTACT_EMAIL),
  };
}

export function siteOrigin() {
  const configured = process.env.SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://127.0.0.1:43123";
}
