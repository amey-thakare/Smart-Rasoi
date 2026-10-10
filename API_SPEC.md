# Smart Rasoi - API Specification (Draft)

Base URL: `/api/v1`

## 1. Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Authenticate and receive JWT
- `GET /auth/me` - Get current user profile

## 2. Profiles & Preferences
- `GET /profile/preferences` - Get user preferences
- `PUT /profile/preferences` - Update user preferences

## 3. Recipes
- `GET /recipes` - List recipes (with pagination & filters)
- `GET /recipes/{id}` - Get recipe details
- `POST /recipes` - Create new recipe
- `PUT /recipes/{id}` - Update recipe
- `DELETE /recipes/{id}` - Delete recipe
- `POST /recipes/{id}/reviews` - Add review/rating

## 4. Kitchen Inventory
- `GET /inventory` - List user inventory
- `POST /inventory` - Add inventory item
- `PUT /inventory/{id}` - Update item
- `DELETE /inventory/{id}` - Delete item
- `POST /inventory/{id}/consume` - Mark item as consumed

## 5. Meal Planning
- `GET /meal-plans` - Get current user meal plans
- `POST /meal-plans` - Generate or create a meal plan
- `PUT /meal-plans/{id}` - Update plan

## 6. Shopping List
- `GET /shopping-lists` - Get shopping lists
- `POST /shopping-lists` - Generate list from recipe/plan
- `PUT /shopping-lists/{id}/items/{itemId}` - Update shopping list item

## 7. AI Features
- `POST /ai/chat` - Chat with Smart Cooking Assistant
- `POST /ai/generate-recipe` - Generate recipe from natural language
- `POST /ai/substitute` - Get ingredient substitutions
- `GET /ai/food-waste-insights` - Get insights on reducing waste based on inventory

## 8. Dashboard
- `GET /dashboard/summary` - Get aggregated stats for the dashboard.
