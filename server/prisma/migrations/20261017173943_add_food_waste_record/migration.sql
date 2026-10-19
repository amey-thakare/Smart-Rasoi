-- CreateTable
CREATE TABLE "FoodWasteRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "inventoryItemId" TEXT,
    "ingredientName" TEXT NOT NULL,
    "quantityWasted" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "estimatedUnitCost" REAL,
    "estimatedTotalCost" REAL,
    "wastedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversedAt" DATETIME,
    "reversalReason" TEXT,
    "restoredToInventory" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FoodWasteRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FoodWasteRecord_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FoodWasteRecord_userId_idx" ON "FoodWasteRecord"("userId");

-- CreateIndex
CREATE INDEX "FoodWasteRecord_wastedAt_idx" ON "FoodWasteRecord"("wastedAt");

-- CreateIndex
CREATE INDEX "FoodWasteRecord_reason_idx" ON "FoodWasteRecord"("reason");

-- CreateIndex
CREATE INDEX "FoodWasteRecord_ingredientName_idx" ON "FoodWasteRecord"("ingredientName");

-- CreateIndex
CREATE INDEX "FoodWasteRecord_isReversed_idx" ON "FoodWasteRecord"("isReversed");
