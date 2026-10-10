# Smart Rasoi - Project State

## Completed in this Session
### Infrastructure & Scaffolding
- Set up monorepo structure with `/backend` and `/frontend`.
- Initialized Spring Boot 3.3.4 (Java 21) backend with Spring Security, Spring Data JPA, Web, PostgreSQL Driver, Flyway Migration, and JSON Web Token (jjwt).
- Initialized React (Vite) + TypeScript frontend with Tailwind CSS and `shadcn/ui` integration.
- Created `docker-compose.yml` for running PostgreSQL, the Spring Boot Backend, and the React Frontend together.

### Backend (Java / Spring Boot)
- **Database**: Configured PostgreSQL. Created Flyway migration scripts (`V1__init.sql` and `V2__seed_data.sql`).
- **Security**: Implemented a complete JWT-based authentication flow (`JwtAuthenticationFilter`, `JwtTokenProvider`, `SecurityConfig`, `CustomUserDetailsService`).
- **Models & Repositories**: Created JPA entities and Spring Data repositories for `User`, `InventoryItem`, and `Recipe`.
- **Controllers**: Created basic controllers for Auth (`/api/v1/auth`), Inventory (`/api/v1/inventory`), and Recipes (`/api/v1/recipes`).
- **AI Integration**: Stubbed `GeminiService` and `AiController` to connect to Google Generative Language API via standard REST template (since official SDK is not used). Note: Requires valid `GEMINI_API_KEY` env var.

### Frontend (React / Vite)
- **Routing**: Set up React Router with protected routes (`DashboardLayout`).
- **State Management**: Used Zustand for auth state (`useAuthStore`).
- **API Client**: Created `services/api.ts` which automatically attaches the JWT Bearer token to requests.
- **Pages**:
  - `Login.tsx` / `Register.tsx` (Shared UI structure).
  - `Dashboard.tsx` with mock stats.
- **Styling**: Configured a modern, clean UI using `shadcn/ui` components (Cards, Inputs, Labels) and a green-centric theme (`#2F5233`, `#b1d8b7`) inside `tailwind.config.js`.

## Remaining Work (Next Phases)
### 1. Complete Frontend UI modules
- Build out the `/recipes` page to fetch and display the list of recipes from `/api/v1/recipes`.
- Build out the `/inventory` page with CRUD operations using `/api/v1/inventory`.
- Add forms to "Add Item" or "Add Recipe".

### 2. Implement Full AI Logic in Backend
- Complete the methods inside `GeminiService.java` to actually construct the prompts for Recipe Generation (from existing inventory), Substitution mapping, and Waste Reduction.
- Expose these via specific endpoints in `AiController`.

### 3. Testing
- Write JUnit tests for `GeminiService` and `AuthService`.
- Write Playwright E2E tests for the frontend.

## How to Run the Application
1. **Prerequisites**: Docker Desktop installed and running.
2. Ensure you are in the root directory: `cd "java project/smart-rasoi"`
3. **Environment Variable**: Set your Gemini API key:
   ```bash
   export GEMINI_API_KEY="your-api-key-here"
   ```
4. **Build and Run**:
   ```bash
   docker-compose up --build -d
   ```
   *Note: This will build the backend (Maven) and frontend (Vite/Nginx) Docker images.*
5. **Access the App**:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8080/api/v1/...`
