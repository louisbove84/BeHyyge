import { randomBytes } from "node:crypto";

const ID_PATTERN = /^[A-Za-z0-9_-]{22}$/;
const SHARE_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function createId() {
  return randomBytes(16).toString("base64url");
}

export function createShareToken() {
  return randomBytes(32).toString("base64url");
}

export function isId(value: string) {
  return ID_PATTERN.test(value);
}

export function isShareToken(value: string) {
  return SHARE_PATTERN.test(value);
}
