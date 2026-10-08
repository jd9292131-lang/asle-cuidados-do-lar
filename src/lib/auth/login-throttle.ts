import { createHmac } from "node:crypto";
import { prisma } from "@/lib/db/prisma";

const WINDOW_MINUTES = 15;
const MAX_FAILED_ATTEMPTS = 20;

function getBucket(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = request.headers.get("x-real-ip")?.trim() || forwardedFor || "unknown";
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET não configurada ou demasiado curta.");
  }

  return createHmac("sha256", secret).update(address).digest("hex");
}

export async function isLoginThrottled(request: Request) {
  const bucket = getBucket(request);
  const entry = await prisma.loginThrottle.findUnique({
    where: { bucket },
    select: { attempts: true, windowStartedAt: true },
  });
  if (!entry) return false;

  return (
    entry.windowStartedAt.getTime() > Date.now() - WINDOW_MINUTES * 60_000 &&
    entry.attempts >= MAX_FAILED_ATTEMPTS
  );
}

export async function recordFailedLogin(request: Request) {
  const bucket = getBucket(request);
  await prisma.$queryRaw<Array<{ attempts: number }>>`
    INSERT INTO "LoginThrottle" ("bucket", "attempts", "windowStartedAt")
    VALUES (${bucket}, 1, CURRENT_TIMESTAMP)
    ON CONFLICT ("bucket") DO UPDATE SET
      "attempts" = CASE
        WHEN "LoginThrottle"."windowStartedAt" <= CURRENT_TIMESTAMP - INTERVAL '15 minutes' THEN 1
        ELSE "LoginThrottle"."attempts" + 1
      END,
      "windowStartedAt" = CASE
        WHEN "LoginThrottle"."windowStartedAt" <= CURRENT_TIMESTAMP - INTERVAL '15 minutes' THEN CURRENT_TIMESTAMP
        ELSE "LoginThrottle"."windowStartedAt"
      END
    RETURNING "attempts"
  `;
  await prisma.loginThrottle.deleteMany({
    where: { windowStartedAt: { lt: new Date(Date.now() - 24 * 60 * 60_000) } },
  });
}
