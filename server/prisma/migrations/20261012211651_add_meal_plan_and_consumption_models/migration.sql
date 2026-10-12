-- CreateTable
CREATE TABLE "MealPlanEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "scheduledDate" DATETIME NOT NULL,
    "mealType" TEXT NOT NULL,
    "servings" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT,
    "cookedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MealPlanEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MealPlanEntry_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealPlanConsumption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mealPlanId" TEXT NOT NULL,
    "inventoryItemId" TEXT,
    "ingredientName" TEXT NOT NULL,
    "quantityDeducted" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "deductedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversedAt" DATETIME,
    CONSTRAINT "MealPlanConsumption_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlanEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MealPlanConsumption_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MealPlanEntry_userId_idx" ON "MealPlanEntry"("userId");

-- CreateIndex
CREATE INDEX "MealPlanEntry_recipeId_idx" ON "MealPlanEntry"("recipeId");

-- CreateIndex
CREATE INDEX "MealPlanEntry_scheduledDate_idx" ON "MealPlanEntry"("scheduledDate");

-- CreateIndex
CREATE INDEX "MealPlanEntry_userId_scheduledDate_idx" ON "MealPlanEntry"("userId", "scheduledDate");

-- CreateIndex
CREATE INDEX "MealPlanEntry_status_idx" ON "MealPlanEntry"("status");

-- CreateIndex
CREATE INDEX "MealPlanConsumption_mealPlanId_idx" ON "MealPlanConsumption"("mealPlanId");

-- CreateIndex
CREATE INDEX "MealPlanConsumption_inventoryItemId_idx" ON "MealPlanConsumption"("inventoryItemId");
