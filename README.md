# Smart Rasoi — AI-Powered Kitchen & Meal Optimisation Platform

## 1. Project Overview
**Smart Rasoi** is a modern food-tech platform engineered to help households manage kitchen ingredients, keep track of expiration windows, plan meals sustainably, and minimize avoidable food waste.

This repository contains:
- **Phase 1**: Dashboard UI, foundation, and Express backend.
- **Phase 2**: SQLite database, Prisma migrations, registration, login, JWT HttpOnly authentication, protected routes, and user profile management.
- **Phase 3**: Persistent kitchen inventory, ingredient CRUD, expiry tracking, low-stock alerts, live statistics, and dashboard integration.
- **Phase 4**: Recipe Management, Recipe Database, Favourites & Real-Time Inventory Matching.
- **Phase 5**: Google Gemini API Integration, Server-Side AI Orchestration, and Interactive AI Kitchen Assistant.
- **Phase 6**: AI Recipe Generation, Recipe Modification, Ingredient Substitution Assistant & Serving Scaler.
- **Phase 7**: Meal Planning, Calendar, Ingredient Reservations & Automatic Inventory Deduction.
- **Phase 8**: Smart Shopping Lists, Grocery Budgets & Cost Optimisation.

---

## 2. Phase 4 Architecture & Scope

### Implemented Capabilities
- **Relational Recipe Schema & Migrations**:
  - Extended SQLite Prisma schema with `Recipe`, `RecipeIngredient`, and `Favourite` models.
  - Applied migration `20261012200113_add_recipe_and_favourite_models` preserving existing users and inventory records.
  - Dual-ownership model: shared read-only seed recipes (`userId = null`, `isPublic = true`) and user-created private recipes (`userId = user.id`, `isPublic = false`).
- **Seed Recipe Engine (`npm run seed:recipes`)**:
  - Idempotent seed script loading 12 chef-crafted shared recipes across Breakfast, Lunch, Dinner, Snacks, Vegetarian, and Quick Meals.
  - Safe execution: running multiple times updates rather than duplicating, and never deletes or alters user-created recipes.
- **Recipe Management & Security**:
  - Listing (`GET /api/recipes`): returns accessible shared recipes and user-owned recipes. Supports multi-field search (title, description, ingredients), category, cuisine, difficulty, maximum preparation time, favourites-only, and available-only filters.
  - Detail View (`GET /api/recipes/:id`): includes ingredients, step-by-step instructions, user favourite status, ownership flags, and live inventory availability.
  - Creation (`POST /api/recipes`): transactional creation of recipe and ingredient rows. Enforces validation (non-empty fields, positive quantities/servings, at least one ingredient) and sets user ownership.
  - Updating (`PATCH /api/recipes/:id`): allows owners to edit recipes and replace ingredient rows in a single database transaction. Strictly prevents editing shared seed recipes (403) and protects other users' private recipes (404).
  - Deletion (`DELETE /api/recipes/:id`): removes user-owned recipes with cascading deletion of ingredients and favourites. Prevents deleting shared seed recipes.
- **Favourites System**:
  - Endpoints: `POST /api/recipes/:id/favourite`, `DELETE /api/recipes/:id/favourite`, and `GET /api/recipes/favourites`.
  - Idempotent toggling and strict user isolation via `@@unique([userId, recipeId])`.
- **Inventory Matching Engine (`GET /api/recipes/matches`)**:
  - Compares recipe requirements against the user's active inventory.
  - **Normalization**: ingredient names are trimmed and compared case-insensitively.
  - **Freshness Check**: expired inventory items (`expiryDate < now`) are excluded from usable stock.
  - **Expiry Priority**: ingredients expiring soon (≤ 7 days) are flagged so users can prioritize using them before spoilage.
  - **Cookability (`canCook`)**: true ONLY when every required ingredient is in stock. Optional ingredients are tagged separately and do not block cooking.
  - **Match Percentage**: calculated as `(availableRequired / totalRequired) * 100`.
- **Frontend Recipes Workspace (`/recipes`)**:
  - Quick view tabs: All Recipes, Can Cook Now, Favourites, and My Recipes.
  - Comprehensive Toolbar: debounced search, category filter, cuisine filter, difficulty filter, prep time selector, and sorting.
  - Dynamic Add/Edit Modal with dynamic ingredient rows, quantity inputs, unit autocomplete, and optional checkboxes.
  - Detail Modal with live ingredient availability badges and step-by-step instructions.
  - Delete confirmation modal for user-owned recipes.
- **Dashboard Integration (`/dashboard`)**:
  - "Discover Recipes" section connects directly to live SQLite recipe matches.
  - Prioritizes recipes with high match percentages and recipes utilizing expiring stock.
  - Direct favourite toggling and modal preview.

---

## 3. Phase 5 Architecture: Gemini Integration & AI Kitchen Assistant

### Server-Side AI Architecture
- **Official Google GenAI SDK**: Integrates `@google/genai` (v2.28.0) strictly on the Node.js/Express backend. The frontend communicates exclusively through `/api/ai/*`, completely preventing any client-side exposure of the API key.
- **Configurable Model & Timeout**:
  - `GEMINI_MODEL`: Configurable via environment variable (default: `gemini-2.5-flash`).
  - `GEMINI_TIMEOUT_MS`: Configurable timeout for conversational generation (default: `25000` ms).
- **Security & Secret Handling**:
  - `GEMINI_API_KEY` is loaded from `server/.env` (excluded by `.gitignore`).
  - `server/.env.example` provides safe placeholder values without secrets.
  - Missing keys or provider errors fail gracefully with safe JSON status codes (503/502/429/504) without exposing credentials, raw stack traces, or provider internals.
- **Context Extraction & Prompt Assembly**:
  - `buildUserKitchenContext(userId)`: Dynamically retrieves verified kitchen stock from SQLite scoped strictly to the authenticated user.
  - Excludes expired ingredients from usable stock and highlights items expiring within 7 days with `[EXPIRING SOON]`.
  - Analyzes accessible recipes (shared seed recipes and user-owned recipes) using `computeRecipeInventoryMatch` to surface top matches with missing/available ingredient lists.
  - Strict isolation prevents cross-user inventory or private recipe leakage.
- **Server-Controlled System Guardrails**:
  - Server sets system instructions enforcing culinary copilot behavior, food waste reduction, explicit disclosure of missing ingredients, and realistic substitutions.
  - Hardened against prompt injection: user messages and database records are treated as untrusted data; client payloads cannot replace or override system instructions.
  - Guardrail prevents false claims: Gemini is instructed that it cannot directly modify databases or claim recipes were saved without explicit user UI interaction.
- **Abuse Prevention**:
  - Per-user in-memory sliding window rate limiter (`aiRateLimiter.js`): caps chat requests to 25 per minute per user to prevent burst abuse and accidental re-render loops.
  - Request payload validation: rejects empty messages, enforces 1000-character user message limits, and validates bounded conversation history turns.

### AI Endpoints (`/api/ai`)
- `POST /api/ai/chat`:
  - **Auth**: Protected by `requireAuth` session cookie.
  - **Body**: `{ message: string, conversationHistory?: Array<{role, content}>, context?: Object }`
  - **Response**: `{ success: true, reply: string, meta: { model, inventoryItemsCount, expiringItemsCount, topMatchedRecipeCount } }`
- `GET /api/ai/context`:
  - **Auth**: Protected by `requireAuth` session cookie.
  - **Response**: Safe summary object `{ success: true, context: { summary, inventory, expiringSoon, topMatchingRecipes } }` without sensitive credentials.

### Interactive Frontend Workspace (`/ai-assistant`)
- **Chat Feed**: Displays back-and-forth user and assistant dialog with role-based bubble styling and lightweight safe markdown formatting (bold, headings, bullet and numbered lists).
- **Suggested Prompts**: 5 quick-start prompt cards:
  1. *"What can I cook with my ingredients?"*
  2. *"Which ingredients should I use before they expire?"*
  3. *"Suggest a quick vegetarian dinner."*
  4. *"What can I substitute for an ingredient?"*
  5. *"Help me cook a simple meal."*
- **Pantry Context Banner & Drawer**: Live connection status indicator with instant inventory count, expiring items count, and collapsible "Pantry Peek" drawer.
- **Error Recovery**: In-feed alert banner with **Retry** button and clear conversation action (`RotateCcw`).
- **Input Flow**: Multiline textarea with Enter to send, Shift+Enter for newline, auto-scroll to latest response, and double-submission locking (`isSubmitting`).

> **Strict Phase Boundary Notice**: Meal planning calendar, automatic inventory deductions, and nutrition tracking are reserved for Phase 7+.

---

## 4. Phase 6 Architecture: AI Recipe Generation, Recipe Modification & Substitutions

Phase 6 implements AI-driven culinary creation and customization directly integrated with Smart Rasoi's kitchen inventory, recipe database, and Gemini intelligence.

### Implemented Capabilities

#### Feature A — Generate Recipes from Available Ingredients
- **Endpoint**: `POST /api/ai/recipes/generate`
- **Pantry Context**: Dynamically pulls active pantry stock from SQLite, prioritizing expiring ingredients (≤ 7 days).
- **Flexible Filters**: Allows combining on-hand pantry selections, manual ingredient additions, strict avoidance lists, cuisine, meal type (breakfast, lunch, dinner, snacks, quick meals), dietary preferences (vegetarian, vegan, gluten-free, dairy-free, high-protein, low-carb), maximum preparation time, difficulty, servings, and custom chef notes.
- **Structured Schema & Normalization**: Returns structured recipe data with preparation time, cook time, difficulty, cuisine, servings, step-by-step instructions, and inventory-aware ingredient classification (`inventoryStatus: 'available'` vs `'missing'`).
- **Pantry Integrity**: Strictly prevents claiming ingredients are available unless they exist in the user's active inventory or were explicitly entered by the user.

#### Feature B — Modify Existing Recipes with AI
- **Endpoint**: `POST /api/ai/recipes/:id/modify`
- **Transformation Styles & Presets**: Supports quick transformations (Make Vegetarian, High Protein, Quicker Prep, Less Spicy/Mild, Adapt to My Pantry, Gluten-Free) or custom culinary instructions.
- **Read-Only Shared Recipe Protection**: When modifying shared catalog/seed recipes (`isPublic: true` or `userId = null`), users cannot overwrite the seed recipe; they can only save the modified version as a new custom recipe.
- **No Automatic Overwrites**: Modifications are returned for review and are **never** persisted to SQLite automatically.
- **In-Place Update Confirmation**: For user-owned recipes, users must explicitly confirm a separate in-place update action before overwriting their original recipe.

#### Feature C — Ingredient Substitution Assistant
- **Endpoint**: `POST /api/ai/substitutions`
- **Culinary Intelligence**: Identifies the ingredient's culinary role (e.g. emulsifier, leavening, moisture, thickener) and suggests tested culinary alternatives.
- **Structured Trade-Offs**: Each alternative includes conversion ratios (e.g., 1:1), taste and texture impacts, cooking adjustments, dietary suitability, and pantry matching (`inInventory: true/false`).
- **Allergy & Safety Advisories**: Flags potential cross-contamination and advises label checking for specified allergens without making unsafe medical guarantees.

#### Feature D — Proportional Serving Scaler & Adjuster
- **Endpoint**: `POST /api/ai/recipes/:id/scale`
- **Mathematical Scaling**: Accurately scales suitable base ingredients proportionally (`scaledQuantity = originalQuantity * (targetServings / originalServings)`).
- **Non-Linear Culinary Guidance**: Flags non-linear ingredients (salt, chili powder, black pepper, baking soda/powder, yeast) with scaling warnings so users do not over-season or alter chemical reactions.
- **Interactive UI Stepper**: Integrated directly into `RecipeDetailModal` with instant proportional updates and live seasoning reminders.

#### Safe Saving Workflow
- **No Auto-Persistence**: Generated and modified recipes are previewed with full details before saving.
- **Workflow Actions**:
  - **Save to Recipes**: Saves validated recipe directly to SQLite scoped to the authenticated user.
  - **Edit Details**: Pre-fills `RecipeFormModal` allowing manual edits before saving.
  - **Regenerate / Adjust Criteria**: Re-runs generation with tweaked parameters.
- **Zero Inventory Deduction**: In accordance with Phase 6 boundaries, saving recipes does NOT deduct inventory items (deduction workflow is reserved for Phase 7).

---

### Frontend
- **Framework**: React.js (v18), Vite
- **Routing**: React Router DOM (v6) with nested Layouts and Protected Route guards
- **HTTP Client**: Axios configured with `withCredentials: true`
- **Icons**: Lucide React
- **Styling**: CSS Modules and CSS Variables design tokens

### Backend
- **Runtime**: Node.js (ES modules), Express.js
- **Database**: SQLite (file-based)
- **ORM & Migrations**: Prisma ORM
- **Security**: `bcryptjs` (password hashing, 10 rounds), `jsonwebtoken` (JWT signing & verification), `cookie-parser`

---

## 5. Phase 7 Architecture: Meal Planning, Calendar & Automatic Inventory Deduction

Phase 7 integrates intelligent meal planning, interactive weekly and monthly calendar views, ingredient requirement aggregation, and atomic inventory consumption with full audit tracking and reversal capabilities.

### Implemented Capabilities

#### Feature A — Meal Planning & Calendar Workspace (`/meal-planner`)
- **Flexible Calendar Views**: Switch between Weekly view (7-day timeline with day-by-day meal columns) and Monthly view (interactive monthly grid with planned meal badges).
- **Navigation**: Previous/Next range navigation, dynamic month/year display, and a 1-click **"Today"** quick return button.
- **Categorized Meal Slots**: Planned meals are organized by standard meal types:
  - **Breakfast**
  - **Lunch**
  - **Dinner**
  - **Snacks**
- **Direct Scheduling**: Users can schedule both shared catalog recipes and their own custom recipes. Servings and custom chef notes can be configured at planning time.
- **Recipe Detail Integration**: Direct **"Add to Meal Plan"** button embedded in `RecipeDetailModal` allows immediate scheduling without leaving the recipe view.
- **Zero Inventory Deduction on Planning**: Planning, editing, or rescheduling meals modifies schedule entries only—inventory quantities are never touched.

#### Feature B — Aggregated Ingredient Requirements & Shopping Shortfalls
- **Endpoint**: `GET /api/meal-plans/requirements?from=YYYY-MM-DD&to=YYYY-MM-DD`
- **Dynamic Servings Scaling**: Scales ingredient quantities proportionally for each planned meal using Phase 6 scaling logic.
- **Pantry Cross-Referencing**: Aggregates identical ingredients across the selected planning window and compares total required amounts against live SQLite kitchen inventory.
- **Expiration Warnings**: Detects inventory items scheduled for consumption that will expire before or on the planned meal date, alerting users to rotate or replenish fresh items.
- **Safe Unit Compatibility**: Uses `unitUtils.js` for safe unit normalization (`g`, `kg`, `ml`, `l`, `tbsp`, `tsp`, `cups`, `pcs`). Incompatible units (e.g. `cups` vs `g`) are flagged with `requiresReview: true` rather than guessing bulk densities.
- **Shopping Shortfall List**: Displays available quantities, required amounts, shortfalls, and a list of specific meals requiring each missing ingredient.

#### Feature C — Core Inventory Consumption When Cooking
- **Endpoints**:
  - `POST /api/meal-plans/:id/cook-preview`: Generates a read-only preview of required ingredients, available stock, shortfall amounts, and deduction amounts. Does not modify the database.
  - `POST /api/meal-plans/:id/cook`: Atomically deducts ingredients from the user's pantry and marks the meal as `COOKED`.
- **Atomic Prisma Transactions**: Deductions, consumption ledger records, and meal status updates are wrapped in `prisma.$transaction`. If any step fails, the entire transaction rolls back.
- **Revalidation Inside Transaction**: Available inventory is re-queried and validated inside the transaction boundary to guard against concurrent mutations since the preview.
- **Idempotency & Duplicate Prevention**: Validates that the meal status is not already `COOKED` and that no active consumption records exist. Repeated cook requests return `409 Conflict`.
- **Partial Cooking Support**: Users can choose `allowPartial: true` to record cooking when non-critical stock is low, consuming up to available stock without going negative.
- **Ownership & Negative Stock Protection**: Strictly rejects deducting stock below 0 or touching inventory belonging to another user.

#### Feature D — Consumption Audit Ledger & Undo/Reversal Workflow
- **Consumption Model (`MealPlanConsumption`)**: Records every deduction with `mealPlanId`, `inventoryItemId`, `ingredientName`, `quantityDeducted`, `unit`, and `deductedAt`.
- **Endpoint**: `POST /api/meal-plans/:id/reverse-consumption`
- **Safe Stock Restoration**: Restores only the exact quantities deducted. Uses a database transaction to increment inventory items, set `isReversed: true`, set `reversedAt`, and revert meal status back to `PLANNED`.
- **Duplicate Reversal Prevention**: Reversing an already reversed consumption returns `400 Bad Request`.
- **Safe Handling of Deleted Items**: If an inventory item was deleted after cooking (`inventoryItemId` is null), the audit trail is preserved and reversal proceeds without crash.

#### Feature E — Meal Lifecycle & Status Rules
- Valid transitions:
  - `PLANNED` → `COOKED` (triggers deduction)
  - `PLANNED` → `SKIPPED` (no deduction)
  - `PLANNED` → `CANCELLED` (no deduction)
  - `COOKED` → `PLANNED` (via explicit `reverse-consumption` confirmation)
- Protected modifications: Cooked meals with active deductions cannot have their recipe or servings edited without first reversing consumption.

#### Feature F — Dashboard Integration
- Live summary widget (`GET /api/meal-plans/dashboard-summary`): Displays today's scheduled meals, next upcoming meal, and meals planned for the current week.
- Seamless quick link directly into `/meal-planner`.

---

## 6. SQLite Schema & Migration History

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id             String          @id @default(cuid())
  name           String
  email          String          @unique
  passwordHash   String
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  inventoryItems InventoryItem[]
  recipes        Recipe[]
  favourites     Favourite[]

  @@index([email])
}

model InventoryItem {
  id              String    @id @default(cuid())
  name            String
  category        String
  quantity        Float
  unit            String
  minimumQuantity Float     @default(1)
  purchaseDate    DateTime?
  expiryDate      DateTime?
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiryDate])
  @@index([category])
}

model Recipe {
  id              String             @id @default(cuid())
  title           String
  description     String?
  instructions    String
  category        String
  cuisine         String?
  prepTimeMinutes Int                @default(0)
  cookTimeMinutes Int                @default(0)
  servings        Int                @default(2)
  difficulty      String             @default("Easy")
  imageUrl        String?
  isPublic        Boolean            @default(false)
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  userId          String?
  user            User?              @relation(fields: [userId], references: [id], onDelete: Cascade)
  ingredients     RecipeIngredient[]
  favourites      Favourite[]

  @@index([userId])
  @@index([category])
  @@index([cuisine])
  @@index([isPublic])
}

model RecipeIngredient {
  id         String   @id @default(cuid())
  recipeId   String
  name       String
  quantity   Float
  unit       String
  isOptional Boolean  @default(false)
  recipe     Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@index([recipeId])
  @@index([name])
}

model Favourite {
  id        String   @id @default(cuid())
  userId    String
  recipeId  String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe    Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@unique([userId, recipeId])
  @@index([userId])
  @@index([recipeId])
}

model MealPlanEntry {
  id            String                 @id @default(cuid())
  userId        String
  recipeId      String
  scheduledDate DateTime
  mealType      String                 // Breakfast, Lunch, Dinner, Snacks
  servings      Int                    @default(2)
  status        String                 @default("PLANNED") // PLANNED, COOKED, SKIPPED, CANCELLED
  notes         String?
  cookedAt      DateTime?
  createdAt     DateTime               @default(now())
  updatedAt     DateTime               @updatedAt
  user          User                   @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe        Recipe                 @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  consumptions  MealPlanConsumption[]

  @@index([userId])
  @@index([recipeId])
  @@index([scheduledDate])
  @@index([userId, scheduledDate])
  @@index([status])
}

model MealPlanConsumption {
  id               String         @id @default(cuid())
  mealPlanId       String
  inventoryItemId  String?
  ingredientName   String
  quantityDeducted Float
  unit             String
  deductedAt       DateTime       @default(now())
  isReversed       Boolean        @default(false)
  reversedAt       DateTime?
  mealPlan         MealPlanEntry  @relation(fields: [mealPlanId], references: [id], onDelete: Cascade)
  inventoryItem    InventoryItem? @relation(fields: [inventoryItemId], references: [id], onDelete: SetNull)

  @@index([mealPlanId])
  @@index([inventoryItemId])
}
```

### Migrations
- `20261012175613_init_user_model`: Created `User` table.
- `20261012194003_add_inventory_model`: Created `InventoryItem` table with foreign key relations and indexes.
- `20261012200113_add_recipe_and_favourite_models`: Created `Recipe`, `RecipeIngredient`, and `Favourite` tables with relations and cascade rules.
- `20261012211651_add_meal_plan_and_consumption_models`: Created `MealPlanEntry` and `MealPlanConsumption` tables with audit trail and cascade rules.

---

## 7. API Endpoints

### Authentication & Inventory
- `/api/health`
- `/api/auth/*` (register, login, me, logout)
- `/api/users/*` (me)
- `/api/inventory/*` (items CRUD, summary statistics)

### Recipe Management & Inventory Matching (Phase 4)
| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/recipes` | Protected | Lists accessible recipes with search, multi-filters, favourites, and sort options |
| `GET` | `/api/recipes/matches` | Protected | Computes real-time inventory matching (match percentage, canCook, expiring ingredients) |
| `GET` | `/api/recipes/favourites` | Protected | Lists favourite recipes saved by the authenticated user |
| `GET` | `/api/recipes/:id` | Protected | Retrieves full recipe details and inventory availability (404 for inaccessible) |
| `POST` | `/api/recipes` | Protected | Creates user-owned recipe and ingredients in a transaction |
| `PATCH` | `/api/recipes/:id` | Protected | Updates user-owned recipe (seed recipes return 403, unauthorized returns 404) |
| `DELETE` | `/api/recipes/:id` | Protected | Deletes user-owned recipe with cascading cleanup (seed recipes return 403) |
| `POST` | `/api/recipes/:id/favourite` | Protected | Adds recipe to favourites (idempotent) |
| `DELETE` | `/api/recipes/:id/favourite` | Protected | Removes recipe from favourites (idempotent) |

### Meal Planning, Calendar & Automatic Inventory Deduction (Phase 7)
| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/meal-plans` | Protected | Fetches meal plans filtered by date range (`from`, `to`) or status |
| `GET` | `/api/meal-plans/dashboard-summary` | Protected | Returns today's meals, next upcoming meal, and current week's planned meals |
| `GET` | `/api/meal-plans/requirements` | Protected | Aggregates scaled ingredient requirements and computes pantry shortfalls |
| `GET` | `/api/meal-plans/:id` | Protected | Retrieves single meal plan entry with recipe details and consumption history |
| `POST` | `/api/meal-plans` | Protected | Schedules a meal plan entry (status `PLANNED`, zero inventory deduction) |
| `PATCH` | `/api/meal-plans/:id` | Protected | Updates meal plan date, servings, type, or notes (zero inventory deduction) |
| `DELETE` | `/api/meal-plans/:id` | Protected | Deletes meal plan entry (blocks deletion if cooked with active deductions) |
| `POST` | `/api/meal-plans/:id/skip` | Protected | Marks planned meal as `SKIPPED` (zero inventory deduction) |
| `POST` | `/api/meal-plans/:id/cancel` | Protected | Marks planned meal as `CANCELLED` (zero inventory deduction) |
| `POST` | `/api/meal-plans/:id/cook-preview` | Protected | Read-only calculation of ingredient deductions, stock, and shortfalls |
| `POST` | `/api/meal-plans/:id/cook` | Protected | Atomically deducts inventory, records ledger, and sets status to `COOKED` |
| `POST` | `/api/meal-plans/:id/reverse-consumption` | Protected | Atomically restores deducted inventory, records reversal, reverts to `PLANNED` |

---

## 8. Running the Application Locally

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Seed Shared Recipes (Idempotent)
```bash
npm run seed:recipes
```

### 3. Start Both Backend and Frontend Concurrently
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend**: [http://localhost:5001](http://localhost:5001)
- **Health Check**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

---

## 9. Automated Testing & Verification

Smart Rasoi features a comprehensive integration test suite operating on an isolated test SQLite database (`server/prisma/test.db`).

### Run Test Suite
```bash
npm test
```

### Run Full Verification (Tests + Production Build)
```bash
npm run check
```

### Test Coverage (95 Passing Tests across 6 Test Suites):
1. **Phase 2 Authentication & Profile (17 Tests)**: registration, duplicate email handling, bcrypt hashing, login credential verification, HttpOnly cookie extraction, session identification, profile updates, and logout.
2. **Phase 3 Kitchen Inventory (18 Tests)**: item creation, numeric and date validation, negative rejection, isolated listing, IDOR cross-user protection (read, update, delete), search, category/expiry/low-stock filters, sorting, summary calculations, and SQLite persistence.
3. **Phase 4 Recipe Management & Matching (20 Tests)**:
   - Accessible listing of shared and user-created recipes.
   - 401 rejection across unauthenticated recipe endpoints.
   - Recipe and ingredient creation with ownership assignment.
   - Payload validation (title, instructions, servings, positive quantities).
   - Relational persistence of ingredients in SQLite.
   - User updating and ingredient list replacement.
   - IDOR protection: cannot update or delete other users' private recipes (404).
   - Read-only protection: shared seed recipes cannot be updated or deleted (403).
   - Multi-criteria search, category, difficulty, and preparation time filtering.
   - Favourites adding, removal, duplicate prevention, and user isolation.
   - Inventory matching: available vs missing ingredient identification.
   - Optional ingredients do not block `canCook`.
   - Expired inventory exclusion from matching.
   - Case-insensitive, whitespace-trimmed ingredient name matching.
   - User inventory isolation during matching.
   - Cascade deletion of user-owned recipes, ingredients, and favourites.
4. **Phase 5 Gemini Integration & AI Assistant (14 Tests)**:
   - 401 rejection on unauthenticated AI endpoints (`/api/ai/chat`, `/api/ai/context`).
   - Rejection of empty, whitespace, and oversized user messages (> 1000 characters).
   - Rejection of invalid conversation history structures, malicious roles, and oversized payloads.
   - User inventory and accessible recipe context loading verified against SQLite.
   - Strict IDOR isolation: other users' inventory items are never included in context or prompt.
   - Strict privacy isolation: other users' private recipes are never included in context or prompt.
   - Security against prompt injection: client cannot override or replace server-controlled system instructions.
   - Successful mocked Gemini response formatting with reply and metadata.
   - Graceful 503 handling when `GEMINI_API_KEY` is missing without leaking server paths or secrets.
   - Safe 429 error mapping for provider quota exhaustion and rate limiting.
   - Safe 504 error mapping for provider timeouts.
   - Safe 502 error mapping for authentication failures without credential exposure.
   - In-memory per-user rate limiting (25 requests/minute threshold) enforcing abuse prevention.
5. **Phase 6 AI Recipe Generation, Modification & Substitutions (13 Tests)**:
   - Valid inventory-aware recipe generation with available vs missing ingredient classification.
   - Rejection of invalid recipe generation payloads (negative prep times, invalid servings).
   - Malformed Gemini JSON handling with graceful error recovery.
   - Gemini provider timeout (504), rate limit (429), and missing API key (503) error mapping.
   - Successful recipe modification with change summary and structured diff output.
   - Rejection of invalid recipe ID on modification endpoints (404).
   - IDOR protection: users cannot modify another user's private recipe (404).
   - Shared catalog protection: seed recipes cannot be updated in-place (403).
   - Verification that AI modifications do not persist automatically to SQLite.
   - Structured ingredient substitution with culinary role, conversions, trade-offs, and allergy alerts.
   - Rejection of empty ingredient substitution requests (400).
   - Proportional servings scaling with non-linear guidance for salt, chili, spices, and leavening.
   - Saving AI-generated recipe to SQLite with owner scoping, zero inventory deductions, and retry idempotency.
6. **Phase 7 Meal Planning, Calendar & Automatic Inventory Deduction (13 Tests)**:
   - Creating planned meal entry with status `PLANNED` and zero inventory deductions.
   - Validation rejection for invalid servings, meal type, or non-existent recipe.
   - IDOR protection: cannot schedule another user's private recipe (404).
   - Fetching meal plans within date ranges scoped to user.
   - Updating meal plan servings, date, and meal type without touching inventory.
   - Transitioning meal status to `SKIPPED` and `CANCELLED` with zero inventory deductions.
   - Calculating aggregated ingredient requirements, shortfalls, and upcoming expiration warnings.
   - Cook preview generation without modifying database or inventory.
   - Rejection of cooking when stock is insufficient and partial fulfillment is disabled (400).
   - Atomic cooking confirmation: deducting exact inventory, writing to `MealPlanConsumption` ledger, setting status to `COOKED`, and preventing duplicate deductions (409 Conflict).
   - Safe undo/reversal (`reverse-consumption`): restoring exact deducted quantities, setting `isReversed: true`, reverting status to `PLANNED`, and preventing duplicate reversals (400).
   - Safe reversal handling when inventory items are deleted after cooking (preserves ledger audit trail without crash).
   - Safe deletion rules: deleting planned meals allowed, deleting cooked meals with unreversed deductions blocked (400).

> **Zero External Dependency Testing**: Automated tests use an in-memory mock client hook in `geminiService.js`. Automated tests **never call external Google endpoints or require a paid/live Gemini API key**.

---

## 10. Phase 8 Architecture: Smart Shopping Lists, Grocery Budgets & Cost Optimisation

### 1. Relational Schema & Migrations
- **Extended Prisma Schema**:
  - `ShoppingList`: user-scoped lists with `name`, `status` (`ACTIVE`, `COMPLETED`, `ARCHIVED`), `budget` (INR), and optional `notes`.
  - `ShoppingListItem`: items with `name`, `category`, `quantity`, `unit`, `estimatedUnitPrice`, `estimatedTotalPrice`, `purchased` boolean, `actualQuantity`, `actualPrice`, `purchaseDate`, and `inventoryItemId` tracking foreign key.
  - `IngredientPrice`: price tracking audit table with `ingredientName`, `quantity`, `unit`, `totalPrice`, `unitPrice`, `store`, and `purchaseDate`.
  - `User`: added `monthlyBudget` and `weeklyBudget` columns.
- **Migration**: Applied `20261012214430_add_shopping_list_and_price_models` to SQLite databases.

### 2. Core API Endpoints
- **Shopping Lists**:
  - `GET /api/shopping-lists`: List all user lists with live computed summary metrics.
  - `POST /api/shopping-lists`: Create a new list with budget and notes.
  - `GET /api/shopping-lists/:id`: Retrieve single list with items and budget summary.
  - `PATCH /api/shopping-lists/:id`: Update list name, budget, notes, or status.
  - `DELETE /api/shopping-lists/:id`: Delete user-owned list with cascade item cleanup.
- **Shopping Items**:
  - `POST /api/shopping-lists/:id/items`: Add item with automatic unit price lookup from price history.
  - `PATCH /api/shopping-lists/:id/items/:itemId`: Update quantity, unit, price estimate, or notes.
  - `DELETE /api/shopping-lists/:id/items/:itemId`: Remove item from list.
- **Meal Plan Shortfall Integration**:
  - `POST /api/shopping-lists/generate-from-meal-plan`: Compile shortfall checklist from meal schedule without deducting pantry stock. Merges or creates new list, preserving manual prices and notes.
- **Purchase & Inventory**:
  - `POST /api/shopping-lists/:id/items/:itemId/purchase`: Mark item as purchased with actual price paid, auto-recording price into history.
  - `POST /api/shopping-lists/:id/items/:itemId/add-to-inventory`: Atomically stock purchased item into kitchen inventory stock, preventing duplicate additions on retries.
- **Budget & Cost Optimisation**:
  - `GET /api/shopping-lists/:id/optimisation`: Deterministic breakdown of top cost drivers, missing prices, and budget overrun warnings.
  - `POST /api/shopping-lists/:id/ai-advice`: Chef Gemini culinary shopping advice.
  - `GET /api/shopping-lists/budget-settings` & `PATCH /api/shopping-lists/budget-settings`: Configure monthly and weekly budget limits.
  - `GET /api/ingredient-prices` & `POST /api/ingredient-prices`: Record manual prices and inspect price trends.
  - `GET /api/shopping-lists/dashboard-summary`: Real-time dashboard shopping and budget metrics.

### 3. Frontend Implementation
- **Shopping List Workspace (`/shopping-list`)**:
  - Dedicated 2-column workspace accessible from sidebar navigation.
  - Real-time budget progress bar and financial summary (Budget, Estimated Total, Actual Spent, Remaining).
  - Status filters (All, To Buy, Purchased) and category dropdown.
  - Checkbox purchase modal with option to add directly to kitchen inventory.
  - Post-purchase "Add to Inventory" action with stock location and expiry date.
- **Meal Requirements Link**:
  - Direct "Generate Shopping List" shortcut in Meal Requirements toolbar.
- **Dashboard Integration**:
  - `ShoppingSummaryCard` with live active list status, monthly budget utilisation bar, and recent purchases.

---

## 11. Manual Verification Guide

1. Open **[http://localhost:5173](http://localhost:5173)** and log in.
2. Navigate to **"Recipes"** (`/recipes`) via the left sidebar or banner link.
3. **Browse Catalogue**:
   - Notice the 12 chef-crafted shared recipes loaded from the database.
   - Switch between tabs: **All Recipes**, **Can Cook Now**, **Favourites**, and **My Recipes**.
4. **Test Favourites**:
   - Click the heart icon on any recipe (e.g. *Fragrant Vegetable Pulao*).
   - Switch to the **Favourites** tab to verify it appears.
   - Refresh the page to confirm favourite persistence.
5. **Inspect Inventory Matching**:
   - Click a recipe card to open `RecipeDetailModal`.
   - Inspect the **Ingredients** checklist: ingredients currently logged in your `/inventory` display green checkmarks and in-stock badges; missing items display missing markers.
   - If an ingredient in your inventory expires within 7 days, note the **"Expiring soon"** flame badge.
6. **Create a Custom Recipe**:
   - Click **"+ Create Recipe"**.
   - Fill in Title (e.g. *Masala Lemonade*), Category (*Beverages*), Prep Time (*5*), Cook Time (*0*), Servings (*2*), Difficulty (*Easy*).
   - Add dynamic ingredients: `Lemon` (1 pcs), `Sugar` (2 tbsp), `Water` (2 cups), `Black Salt` (0.5 tsp, Optional).
   - Click **"Create Recipe"**.
   - Notice the new recipe appears in the catalogue tagged with **"My Recipe"**.
7. **Edit and Delete Recipe**:
   - Open your custom recipe, click **"Edit Recipe"**, change servings or ingredients, and save.
   - Click the trash icon on your recipe, confirm deletion, and verify it is removed from the catalog.
8. **Dashboard Live Sync**:
   - Navigate to `/dashboard`.
   - The **"Discover Recipes"** section displays live database recipes matched to your inventory with match percentage bars and live detail previews.
9. **AI Kitchen Assistant (`/ai-assistant`)**:
   - Click **"AI Assistant"** in the sidebar.
   - Notice the **"Live Pantry Connected"** status indicator with active count of ingredients and expiring items.
   - Click **"Pantry Peek"** to view collapsible chips of ingredients nearing expiry and pantry stock.
   - Click any suggested prompt (e.g. *"What can I cook with my ingredients?"* or *"Which ingredients should I use before they expire?"*).
   - Notice the typing indicator while Chef Gemini processes the request.
   - Ask culinary questions (e.g. *"What can I substitute for buttermilk?"*, *"Suggest a quick vegetarian meal using paneer"*).
   - Test multiline input using **Shift + Enter**, and submit with **Enter**.
   - Click **"Clear Chat"** to verify session conversation reset.
10. **Phase 6: AI Recipe Studio (`/recipes`)**:
    - Click **"AI Recipe Studio"** button in the header toolbar.
    - Notice your pantry inventory displayed as interactive selection chips.
    - Select on-hand ingredients, choose meal type (*Dinner*), cuisine (*Indian*), and max prep time (*30 mins*).
    - Click **"Generate Recipe with AI"**.
    - Review the generated recipe: check preparation time, step-by-step instructions, and available vs missing ingredient badges.
    - Click **"Save to My Recipes"** or **"Edit Details"** to customize before saving. Confirm that saving does NOT deduct pantry stock.
11. **Phase 6: AI Recipe Modification**:
    - Open any recipe detail modal (e.g. *Paneer Butter Masala*).
    - Click **"Modify with AI"**.
    - Select a preset style (e.g. *"Make Vegetarian"*, *"High Protein"*, or *"Quicker Prep"*) or write a custom prompt (e.g. *"Substitute paneer with tofu and make it mild"*).
    - Click **"Generate Modified Recipe"**.
    - Review the **"Culinary Modifications Applied"** summary banner, updated ingredients, and adapted instructions.
    - Save as a new recipe or, for your own recipes, click **"Update Existing"** and confirm the prompt.
12. **Phase 6: Ingredient Substitution Assistant**:
    - In any recipe detail modal, click the **"Substitute"** button next to any ingredient (e.g. *Heavy Cream* or *Garam Masala*).
    - Review culinary substitutes tailored to your reason (e.g. *"Dairy allergy"*, *"Out of stock"*).
    - Notice conversion ratios, taste/texture trade-offs, required cooking adjustments, and whether the replacement is currently in your pantry stock.
13. **Phase 6: Servings Scaling**:
    - In `RecipeDetailModal`, use the `-` and `+` servings adjuster to scale the dish from 2 to 4 or 6 servings.
    - Observe instantaneous recalculation of ingredient quantities and notice the non-linear culinary caution badge for spices and leavening.
14. **Phase 7: Weekly & Monthly Meal Planning (`/meal-planner`)**:
    - Click **"Meal Planner"** in the sidebar.
    - Switch between **Weekly** and **Monthly** calendar views.
    - Click **"Next"** and **"Previous"** to navigate weeks/months, then click **"Today"** to instantly return to current week.
    - Click **"+ Plan Meal"** on any day card.
    - Select a recipe (e.g. *Masala Lemonade* or *Fragrant Vegetable Pulao*), choose meal type (*Breakfast*, *Lunch*, *Dinner*, *Snacks*), set servings, add optional notes, and click **"Schedule Meal"**.
    - Verify the meal appears under the selected day column with a blue **"Planned"** badge.
15. **Phase 7: Schedule Directly from Recipe Detail**:
    - Navigate to `/recipes`, click any recipe card to open `RecipeDetailModal`.
    - Click the **"Add to Meal Plan"** button in the header.
    - Choose a date and meal type, and click **"Schedule Meal"**.
    - Notice confirmation feedback and verify the entry appears in `/meal-planner`.
16. **Phase 7: Ingredient Requirements & Shopping Shortfalls**:
    - In `/meal-planner`, click the **"Ingredient Requirements"** tab.
    - View the aggregated ingredient breakdown for the current period: Required Quantity, Available in Pantry, and Shortfall.
    - If an item is in stock but expires before the scheduled date, notice the orange **"Expiring Before Meal"** alert badge.
    - Toggle the **"Shortfalls Only"** filter to see a shopping checklist with meals requiring each item.
17. **Phase 7: Cook Meal & Automatic Inventory Deduction**:
    - In the weekly calendar, find a planned meal and click **"Cook"**.
    - In `CookMealModal`, review the live **Consumption Preview** displaying required quantities vs pantry stock.
    - Click **"Confirm & Deduct Stock"**.
    - Notice the meal status immediately transitions to a green **"Cooked"** badge with timestamp.
    - Navigate to `/inventory` and verify that the corresponding ingredient quantities have been automatically deducted.
18. **Phase 7: Undo / Reverse Consumption**:
    - In `/meal-planner`, find the cooked meal and click **"Undo Cook"**.
    - In `ReverseConsumptionModal`, review the exact quantities that will be restored to pantry stock.
    - Click **"Confirm & Restore Stock"**.
    - Notice the meal reverts back to **"Planned"** status.
    - Check `/inventory` and verify that the deducted quantities are accurately restored.
19. **Phase 8: Smart Shopping Lists (`/shopping-list`)**:
    - Navigate to **"Shopping List"** in the sidebar.
    - Click **"New List"**, specify name (e.g. *Weekly Groceries*), budget (e.g. *₹1,500*), and optional store notes.
    - Add items manually using **"Add Item"**, with quantity, unit, and estimated unit price.
20. **Phase 8: Generate Shopping List from Meal Plans**:
    - In `/shopping-list`, click **"Generate from Meal Plan"** (or click the shortcut from `/meal-planner` -> Ingredient Requirements).
    - Choose date range (e.g. next 7 days).
    - Inspect the shortfall analysis preview (meals count, pantry items, items to buy).
    - Choose **"Create New Shopping List"** or **"Merge into Existing List"**, and confirm. Verify pantry stock is NOT deducted.
21. **Phase 8: Budget Management & Real-Time Tracking**:
    - Click **"Budget Limits"** in the header to set monthly and weekly grocery budgets.
    - On any shopping list, observe the budget overview card displaying List Budget, Estimated Total, Actual Spent, and Remaining Budget.
    - If estimated items exceed the budget ceiling, verify the red **Over-Budget Warning** banner.
22. **Phase 8: Purchase Tracking & Price History**:
    - Click the circle checkbox next to any shopping item to open `PurchaseItemModal`.
    - Enter actual quantity purchased, actual total price paid, and store name.
    - Click **"Confirm Purchase"**. Notice the item status updates to **Purchased** with strikethrough styling and actual spend updates the budget summary.
    - Click **"Price Tracking"** in the header and verify that the purchase was automatically logged into the verified price history and price trends.
23. **Phase 8: Add Purchased Items Directly to Pantry Stock**:
    - For any purchased item, click **"Add to Inventory"**.
    - Select storage location (*Pantry*, *Fridge*, *Freezer*) and optional expiry date.
    - Confirm the action: verify the badge changes to a green checkmark **"In Pantry"**.
    - Navigate to `/inventory` and confirm the stock was updated accurately without duplicate entry.
24. **Phase 8: Cost Optimisation & AI Shopping Advice**:
    - On any active shopping list, click **"Cost Optimisation"**.
    - Review the **Top Cost Drivers** bar chart showing the highest contributing ingredients to the list cost.
    - Review **Missing Prices** indicators and actionable budget tips.
    - Switch to the **Chef Gemini AI Advice** tab, click a prompt (e.g. *"How can I reduce my grocery cost using my current pantry?"*), and review the personalized culinary recommendations.
25. **Phase 8: Dashboard Integration (`/dashboard`)**:
    - Navigate to `/dashboard`.
    - Review the **Smart Grocery Shopping & Budget** widget displaying active lists, pending items count, monthly budget progress bar, and recent purchases.

---

## 12. Gemini Configuration & Troubleshooting

### Environment Configuration (`server/.env`)
```env
# Gemini API Configuration
GEMINI_API_KEY=your_actual_google_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash
GEMINI_TIMEOUT_MS=25000
```

> **Security Warning**:
> Never commit `server/.env` to Git or share your secret API key.
> `server/.env` is strictly excluded in `.gitignore`. Use `server/.env.example` as a template with placeholder values.

### Model Resiliency & Fallback Strategy
Smart Rasoi uses `gemini-3.5-flash` by default. If the configured model returns a 404 deprecation error or a 503 high-demand spike, the backend automatically fails over across `['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest']` without disrupting the user session.

### Troubleshooting Common Issues
| Error Code / Symptom | Root Cause | Solution |
| :--- | :--- | :--- |
| **503 Service Unavailable** | `GEMINI_API_KEY` is missing or contains placeholder in `server/.env` | Obtain an API key from [Google AI Studio](https://aistudio.google.com/) and paste into `server/.env`. |
| **502 Bad Gateway / Auth Error** | The configured `GEMINI_API_KEY` is invalid, expired, or revoked | Verify that the key is active and correctly formatted in `server/.env` without leading or trailing spaces. |
| **502 Bad Gateway / Model Error** | The configured `GEMINI_MODEL` is unavailable or deprecated | Set `GEMINI_MODEL=gemini-3.5-flash` in `server/.env`. |
| **429 Too Many Requests** | (a) In-memory rate limiter exceeded (>25 requests/min per user), or (b) Google Gemini quota exceeded | Wait 60 seconds before sending more requests. Check quota usage in the Google Cloud Console. |
| **504 Gateway Timeout** | Gemini generation took longer than `GEMINI_TIMEOUT_MS` (default 25s) | Check network stability or increase `GEMINI_TIMEOUT_MS=35000` in `server/.env`. |

# java-project
