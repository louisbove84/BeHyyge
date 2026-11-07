export type UnlockClaims = {
  galleryId: string;
  passwordVersion: number;
  exp: number;
};

export function canViewGallery(input: {
  galleryId: string;
  hasPassword: boolean;
  passwordVersion: number;
  claims: UnlockClaims | null;
  now: number;
}) {
  if (!input.hasPassword) return true;
  const claims = input.claims;
  if (!claims) return false;
  if (claims.galleryId !== input.galleryId) return false;
  if (claims.passwordVersion !== input.passwordVersion) return false;
  if (!Number.isFinite(claims.exp) || claims.exp <= input.now) return false;
  return true;
}
