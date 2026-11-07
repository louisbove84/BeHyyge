import "server-only";

import { createHash } from "node:crypto";
import { nextRateCount, type RateWindow } from "@/lib/rate";
import { rateLimitPath } from "@/lib/paths";
import { clientAddress, assertSessionSecret } from "@/lib/auth";
import { mutateJson, withBlobErrors } from "@/lib/store";
import { HttpError } from "@/lib/http";

const LIMITS = {
  login: { limit: 8, windowMs: 15 * 60 * 1000 },
  setup: { limit: 5, windowMs: 15 * 60 * 1000 },
  unlock: { limit: 8, windowMs: 15 * 60 * 1000 },
  upload: { limit: 150, windowMs: 10 * 60 * 1000 },
} as const;

export async function enforceRateLimit(
  request: Request,
  scope: keyof typeof LIMITS,
  extra = "",
) {
  const secret = assertSessionSecret();
  const subject = createHash("sha256")
    .update(`${secret}:${scope}:${clientAddress(request)}:${extra}`)
    .digest("base64url")
    .slice(0, 40);
  const rule = LIMITS[scope];
  let allowed = false;
  await withBlobErrors(() =>
    mutateJson<RateWindow>(
      rateLimitPath(scope, subject),
      () => {
        allowed = true;
        return { windowStart: Date.now(), count: 1 };
      },
      (current) => {
        const decision = nextRateCount(current, Date.now(), rule.windowMs, rule.limit);
        allowed = decision.allowed;
        if (decision.count === current.count && decision.windowStart === current.windowStart) {
          return current;
        }
        return { windowStart: decision.windowStart, count: decision.count };
      },
    ),
  );
  if (!allowed) {
    throw new HttpError(429, "Too many attempts. Wait a few minutes and try again.");
  }
}
