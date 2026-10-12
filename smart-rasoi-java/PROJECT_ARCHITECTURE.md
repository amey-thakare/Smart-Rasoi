# SMART RASOI — PROJECT ARCHITECTURE & DUAL-LAYER DESIGN
## Strict Architectural Separation Between the Live MERN Website and the Academic Java Layer

This document details the architectural design of Smart Rasoi, explaining the dual-layer structure that preserves the operational MERN production application while introducing an isolated Java codebase for academic syllabus demonstration.

---

## 1. High-Level Architectural Diagram

```
+---------------------------------------------------------------------------------------------------+
|                                       SMART RASOI PLATFORM                                        |
+---------------------------------------------------------------------------------------------------+
                                                  |
         +----------------------------------------+---------------------------------------+
         |                                                                                |
         v                                                                                v
+-------------------------------------------------+     +-------------------------------------------------+
|          PRIMARY PRODUCTION WEB APPLICATION     |     |          ACADEMIC SYLLABUS CODEBASE             |
|                  (MERN STACK)                   |     |              (JAVA SE / EE)                     |
+-------------------------------------------------+     +-------------------------------------------------+
| • Frontend: React 18, Vite, Lucide Icons        |     | • Core: Pure Standard JDK (Units 1 - 4)         |
| • Backend: Node.js, Express                     |     | • Concurrency: Threads, Runnables, Locks        |
| • Database: SQLite with Prisma ORM              |     | • Desktop: JavaFX Controls & Interactive Screen |
| • AI Assistant: Google Gemini 2.5/3.5 Flash     |     | • Database: JDBC with SQLite (Unit 5)           |
| • Auth: JWT & HTTP-only cookies                 |     | • Web: Servlets, JSP, JavaBeans & web.xml       |
| • Launch Command: npm run dev                   |     | • Execution: Independent scripts (compile.sh)   |
| • Port: 5173 (Client) / 5001 (Server)           |     | • Storage: smart_rasoi_academic.db (isolated)   |
+-------------------------------------------------+     +-------------------------------------------------+
                         |                                                       |
                         +-------------------- NO DEPENDENCY --------------------+
                                      (Zero Cross-App Linkage)
```

---

## 2. Strict Isolation Principles

### Principle 1: Runtime Independence
- **The MERN application is 100% self-sufficient.** To run Smart Rasoi for any live demo, evaluation, or website presentation, the user only executes:
  ```bash
  npm run dev
  ```
- No Java Virtual Machine, Java compiler, Tomcat server, Maven, or Gradle runtime is required to run, build, or test the primary Smart Rasoi website.

### Principle 2: Database Storage Isolation
- **MERN Database:** Stored in `server/prisma/dev.db` (and `server/test.db` during test suites). It uses Prisma ORM migrations, schemas, and relational models.
- **Java Academic Database:** Stored in `smart-rasoi-java/smart_rasoi_academic.db`. It is accessed strictly via native Java JDBC (`Connection`, `PreparedStatement`, `ResultSet`) using `DatabaseConnection.java`.
- **Guarantee:** The Java layer will **never** alter, reset, lock, or read records from the MERN database files.

### Principle 3: Environment Configuration and Secret Isolation
- The MERN application manages environment variables (`GEMINI_API_KEY`, `JWT_SECRET`, `PORT=5001`) via `server/.env`.
- The Java academic layer maintains independent credentials. In particular, user passwords in Java are hashed using `java.security.MessageDigest` (SHA-256 with `SecureRandom` 16-byte salts) and stored solely in the Java SQLite database. No secrets are shared or reused.

### Principle 4: Build System Isolation
- The root `package.json`, client `vite.config.js`, and test scripts do not reference or invoke Java files.
- The `smart-rasoi-java/` directory contains its own standalone compilation scripts (`scripts/compile.sh`), binary output directory (`bin/`), and documentation.

---

## 3. Domain Model Alignment

Both applications share the exact same culinary optimization business domain:

| Domain Entity | MERN Application (TypeScript/Prisma) | Java Academic Layer (`smart-rasoi-java/`) | Academic Syllabus Concepts |
| :--- | :--- | :--- | :--- |
| **Kitchen Item** | Conceptual Base Entity | `com.smartrasoi.model.KitchenItem` | Abstract Class, Static Blocks, Protected fields |
| **Pantry Ingredient** | `InventoryItem` (Prisma Model) | `com.smartrasoi.model.Ingredient` | Inheritance, Overloading, Overriding, Interfaces |
| **Perishable Stock** | Filter logic based on `expiryDate` | `com.smartrasoi.model.PerishableIngredient` | Multilevel Inheritance, `super` keyword |
| **Recipe** | `Recipe` (Prisma Model) | `com.smartrasoi.model.Recipe` | Composition, Collections (`List`), Serialization |
| **Recipe Ingredient** | `RecipeIngredient` (Prisma Model) | `com.smartrasoi.model.RecipeIngredient` | Aggregation, Measurement conversion |
| **Meal Planning** | `MealPlan` (Prisma Model) | `com.smartrasoi.model.MealPlan` | Enums (`MealType`, `MealStatus`), State machines |
| **Shopping List** | `ShoppingList` (Prisma Model) | `com.smartrasoi.model.ShoppingList` | CostCalculable Interface, Budget enforcement |
| **Shopping Item** | `ShoppingListItem` (Prisma Model) | `com.smartrasoi.model.ShoppingListItem` | Estimated vs actual cost tracking |
| **User & Auth** | `User` (bcrypt + JWT) | `com.smartrasoi.model.User` | Salted SHA-256 via `MessageDigest` + `SecureRandom` |
| **Inventory Logic** | `inventoryService.js` | `com.smartrasoi.service.InventoryService` | Iterators (`remove()`), Comparators, Streams |
| **Recipe Matching** | `inventoryMatchingService.js` | `com.smartrasoi.service.RecipeService` | Match scoring, Missing item calculation |
| **Shopping Optimizer** | `costOptimisationService.js` | `com.smartrasoi.service.ShoppingService` | Deduplication using `Set`, Shortfall compilation |

---

## 4. Why This Dual-Layer Approach Is Ideal for University Evaluation

1. **Academic Integrity:** The Java code is genuine, cleanly structured, and genuinely implements every single topic required by the syllabus without superficial placeholders or mocking.
2. **Zero Regression Risk:** The modern web application built across Phases 1 through 8 remains 100% operational, fully responsive, and completely protected from any Java classpath, version, or tooling complications.
3. **Faculty Assessment Readiness:** Faculty can evaluate the core Java fundamentals using standard CLI runners, evaluate desktop GUI programming through JavaFX, and evaluate enterprise web patterns through Servlets and JSP.
