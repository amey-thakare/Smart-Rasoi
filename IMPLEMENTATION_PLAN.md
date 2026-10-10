# Smart Rasoi - Implementation Plan

## Phase 1: Inspect and Plan
- [x] Create project structure
- [x] Write `IMPLEMENTATION_PLAN.md`
- [x] Write `ARCHITECTURE.md`
- [x] Write `API_SPEC.md`

## Phase 2: Backend Foundation
- [ ] Initialize Spring Boot 3.x project (Java 21).
- [ ] Configure PostgreSQL, Flyway, and Spring Data JPA.
- [ ] Set up Spring Security and JWT.
- [ ] Implement global exception handling and OpenAPI (Swagger).

## Phase 3: Frontend Foundation
- [ ] Initialize React + Vite + TypeScript project.
- [ ] Configure Tailwind CSS and shadcn/ui.
- [ ] Set up React Router and TanStack Query.
- [ ] Create layout and basic authentication pages (Login, Register).

## Phase 4: Core Modules
- [ ] Authentication & User Profiles: Registration, Login, Profile Management.
- [ ] Recipe Management: CRUD operations, Search, Filters, Ratings & Reviews.
- [ ] Kitchen Inventory: Add, Edit, Consume, Expiry Tracking.
- [ ] Recommendations Engine: Scoring based on inventory, expiry, and preferences.
- [ ] Nutrition Analysis: Track macros, calories, comparisons.
- [ ] Smart Meal Planner: 7-day planning, daily budgets.
- [ ] Smart Shopping List: Generation from recipes/plans/inventory.
- [ ] Budget Optimisation: Tracking and analytics.
- [ ] Dashboard Analytics: Aggregating all data.

## Phase 5: Gemini Integration
- [ ] Integrate Google Gemini API using official GenAI SDK for Java.
- [ ] Implement AI Smart Cooking Assistant (Chat).
- [ ] Implement AI Recipe Generation.
- [ ] Implement Ingredient Substitution.
- [ ] Implement Food Waste Insights.

## Phase 6: Testing & Refinement
- [ ] Write Backend Unit/Integration Tests.
- [ ] Execute tests and fix bugs.
- [ ] Seed database with realistic data.

## Phase 7: Deployment Readiness
- [ ] Create Backend Dockerfile.
- [ ] Create Frontend Dockerfile.
- [ ] Provide Docker Compose setup.
- [ ] Update README with setup instructions.
