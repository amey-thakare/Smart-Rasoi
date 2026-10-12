-- AlterTable
ALTER TABLE "User" ADD COLUMN "monthlyBudget" REAL;
ALTER TABLE "User" ADD COLUMN "weeklyBudget" REAL;

-- CreateTable
CREATE TABLE "ShoppingList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "budget" REAL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ShoppingList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShoppingListItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shoppingListId" TEXT NOT NULL,
    "ingredientName" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "estimatedUnitPrice" REAL,
    "estimatedTotalPrice" REAL,
    "actualUnitPrice" REAL,
    "actualTotalPrice" REAL,
    "isPurchased" BOOLEAN NOT NULL DEFAULT false,
    "purchasedQuantity" REAL,
    "purchasedUnit" TEXT,
    "purchasedAt" DATETIME,
    "inventoryItemId" TEXT,
    "addedToInventory" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ShoppingListItem_shoppingListId_fkey" FOREIGN KEY ("shoppingListId") REFERENCES "ShoppingList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShoppingListItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IngredientPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ingredientName" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "unitPrice" REAL NOT NULL,
    "quantity" REAL,
    "source" TEXT,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IngredientPrice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ShoppingList_userId_idx" ON "ShoppingList"("userId");

-- CreateIndex
CREATE INDEX "ShoppingList_status_idx" ON "ShoppingList"("status");

-- CreateIndex
CREATE INDEX "ShoppingListItem_shoppingListId_idx" ON "ShoppingListItem"("shoppingListId");

-- CreateIndex
CREATE INDEX "ShoppingListItem_ingredientName_idx" ON "ShoppingListItem"("ingredientName");

-- CreateIndex
CREATE INDEX "ShoppingListItem_isPurchased_idx" ON "ShoppingListItem"("isPurchased");

-- CreateIndex
CREATE INDEX "IngredientPrice_userId_idx" ON "IngredientPrice"("userId");

-- CreateIndex
CREATE INDEX "IngredientPrice_ingredientName_idx" ON "IngredientPrice"("ingredientName");

-- CreateIndex
CREATE INDEX "IngredientPrice_recordedAt_idx" ON "IngredientPrice"("recordedAt");
