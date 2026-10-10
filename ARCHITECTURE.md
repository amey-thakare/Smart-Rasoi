# Smart Rasoi - Architecture

## Tech Stack
### Backend
- **Language:** Java 21
- **Framework:** Spring Boot 3.x
- **Database:** PostgreSQL
- **ORM & Migrations:** Spring Data JPA, Hibernate, Flyway
- **Security:** Spring Security (JWT)
- **API Docs:** Springdoc OpenAPI
- **AI Integration:** Google GenAI Java SDK (Gemini API)

### Frontend
- **Framework:** React with TypeScript, built with Vite
- **Styling:** Tailwind CSS, shadcn/ui
- **State & Data Fetching:** TanStack Query, React Hook Form, Zod
- **Routing:** React Router
- **Visuals:** Recharts, Lucide Icons

### Infrastructure
- **Containerization:** Docker, Docker Compose
- **Monorepo Structure:** Backend and Frontend in unified repository.

## System Architecture Layering
1. **Presentation Layer (Frontend):** React SPA communicating via REST API.
2. **Controller Layer (Backend):** Spring REST Controllers handling HTTP requests/responses, secured by JWT.
3. **Service Layer (Backend):** Core business logic, integrating different modules (Recipe, Inventory, AI).
4. **Data Access Layer (Backend):** Spring Data JPA repositories abstracting DB interactions.
5. **Database Layer:** PostgreSQL handling relational persistence.

## Modules & Domains
- **User Management:** Users, Preferences, Dietary Restrictions.
- **Recipe Management:** Recipes, Ingredients, Instructions, Reviews.
- **Inventory Management:** InventoryItems, Tracking Expiries.
- **Meal Planning:** MealPlans, Nutritional Goals.
- **Shopping & Budget:** ShoppingLists, GroceryPurchases.
- **AI Integration:** Dedicated Gemini service handling generative features securely on the backend.
