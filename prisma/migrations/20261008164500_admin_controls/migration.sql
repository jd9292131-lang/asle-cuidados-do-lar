ALTER TABLE "User"
ADD COLUMN "statusReason" TEXT,
ADD COLUMN "suspendedUntil" TIMESTAMP(3);

CREATE TABLE "BlobCleanup" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "requestedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,

    CONSTRAINT "BlobCleanup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BlobCleanup_storageKey_key" ON "BlobCleanup"("storageKey");
CREATE INDEX "BlobCleanup_createdAt_idx" ON "BlobCleanup"("createdAt");

ALTER TABLE "BlobCleanup"
ADD CONSTRAINT "BlobCleanup_requestedBy_fkey"
FOREIGN KEY ("requestedBy") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "LoginThrottle" (
    "bucket" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "windowStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginThrottle_pkey" PRIMARY KEY ("bucket")
);

CREATE INDEX "LoginThrottle_windowStartedAt_idx" ON "LoginThrottle"("windowStartedAt");
