-- CreateTable
CREATE TABLE "RecipeNutrition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "servings" INTEGER NOT NULL DEFAULT 2,
    "calories" REAL NOT NULL,
    "proteinGrams" REAL NOT NULL,
    "carbohydratesGrams" REAL NOT NULL,
    "fatGrams" REAL NOT NULL,
    "fiberGrams" REAL NOT NULL,
    "sugarGrams" REAL,
    "sodiumMilligrams" REAL,
    "source" TEXT NOT NULL DEFAULT 'CALCULATED',
    "isEstimated" BOOLEAN NOT NULL DEFAULT true,
    "completenessScore" REAL NOT NULL DEFAULT 100,
    "missingIngredients" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecipeNutrition_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DietaryProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dietaryPreference" TEXT,
    "dailyCalorieTarget" REAL,
    "proteinTarget" REAL,
    "carbohydrateTarget" REAL,
    "fatTarget" REAL,
    "fiberTarget" REAL,
    "sodiumTarget" REAL,
    "allergies" TEXT,
    "dislikedIngredients" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DietaryProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealConsumptionHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mealPlanId" TEXT,
    "recipeId" TEXT,
    "recipeTitle" TEXT NOT NULL,
    "consumedDate" DATETIME NOT NULL,
    "mealType" TEXT NOT NULL,
    "servingsConsumed" REAL NOT NULL DEFAULT 1,
    "calories" REAL,
    "proteinGrams" REAL,
    "carbohydratesGrams" REAL,
    "fatGrams" REAL,
    "fiberGrams" REAL,
    "sugarGrams" REAL,
    "sodiumMilligrams" REAL,
    "source" TEXT NOT NULL DEFAULT 'COOKED_MEAL',
    "isEstimated" BOOLEAN NOT NULL DEFAULT true,
    "completenessScore" REAL,
    "notes" TEXT,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MealConsumptionHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MealConsumptionHistory_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MealConsumptionHistory_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlanEntry" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RecipeNutrition_recipeId_key" ON "RecipeNutrition"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeNutrition_recipeId_idx" ON "RecipeNutrition"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "DietaryProfile_userId_key" ON "DietaryProfile"("userId");

-- CreateIndex
CREATE INDEX "DietaryProfile_userId_idx" ON "DietaryProfile"("userId");

-- CreateIndex
CREATE INDEX "MealConsumptionHistory_userId_idx" ON "MealConsumptionHistory"("userId");

-- CreateIndex
CREATE INDEX "MealConsumptionHistory_consumedDate_idx" ON "MealConsumptionHistory"("consumedDate");

-- CreateIndex
CREATE INDEX "MealConsumptionHistory_mealPlanId_idx" ON "MealConsumptionHistory"("mealPlanId");

-- CreateIndex
CREATE INDEX "MealConsumptionHistory_isReversed_idx" ON "MealConsumptionHistory"("isReversed");
