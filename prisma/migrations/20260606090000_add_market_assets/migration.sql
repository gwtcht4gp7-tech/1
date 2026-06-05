-- CreateTable
CREATE TABLE IF NOT EXISTS "MarketAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "name" TEXT,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "MarketAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MarketAsset_userId_type_idx" ON "MarketAsset"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "MarketAsset_userId_type_symbol_key" ON "MarketAsset"("userId", "type", "symbol");
