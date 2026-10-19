import axios from 'axios';

// Centralised API client configured with base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Automatically sends and receives HttpOnly cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Health check endpoint service method
 */
export const fetchHealthCheck = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

/**
 * Register a new user
 */
export const registerApi = async ({ name, email, password, confirmPassword }) => {
  const response = await apiClient.post('/auth/register', {
    name,
    email,
    password,
    confirmPassword
  });
  return response.data;
};

/**
 * Log in an existing user
 */
export const loginApi = async ({ email, password }) => {
  const response = await apiClient.post('/auth/login', {
    email,
    password
  });
  return response.data;
};

/**
 * Get current authenticated user session
 */
export const getMeApi = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

/**
 * Log out user session
 */
export const logoutApi = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

/**
 * Update authenticated user profile name
 */
export const updateProfileApi = async ({ name }) => {
  const response = await apiClient.patch('/users/me', { name });
  return response.data;
};

/**
 * Fetch inventory items with search, filter, and sort options
 */
export const fetchInventoryItems = async (params = {}) => {
  const response = await apiClient.get('/inventory', { params });
  return response.data;
};

/**
 * Fetch inventory summary statistics
 */
export const fetchInventorySummary = async () => {
  const response = await apiClient.get('/inventory/summary');
  return response.data;
};

/**
 * Fetch single inventory item by ID
 */
export const fetchInventoryItem = async (id) => {
  const response = await apiClient.get(`/inventory/${id}`);
  return response.data;
};

/**
 * Create a new inventory item
 */
export const createInventoryItem = async (itemData) => {
  const response = await apiClient.post('/inventory', itemData);
  return response.data;
};

/**
 * Update an existing inventory item
 */
export const updateInventoryItem = async (id, itemData) => {
  const response = await apiClient.patch(`/inventory/${id}`, itemData);
  return response.data;
};

/**
 * Delete an inventory item
 */
export const deleteInventoryItem = async (id) => {
  const response = await apiClient.delete(`/inventory/${id}`);
  return response.data;
};

/**
 * Fetch recipes with optional query filters
 */
export const fetchRecipes = async (params = {}) => {
  const response = await apiClient.get('/recipes', { params });
  return response.data;
};

/**
 * Fetch recipe matches computed against user inventory
 */
export const fetchRecipeMatches = async () => {
  const response = await apiClient.get('/recipes/matches');
  return response.data;
};

/**
 * Fetch user favourite recipes
 */
export const fetchRecipeFavourites = async () => {
  const response = await apiClient.get('/recipes/favourites');
  return response.data;
};

/**
 * Fetch single recipe details by ID
 */
export const fetchRecipeById = async (id) => {
  const response = await apiClient.get(`/recipes/${id}`);
  return response.data;
};

/**
 * Create a new recipe
 */
export const createRecipe = async (recipeData) => {
  const response = await apiClient.post('/recipes', recipeData);
  return response.data;
};

/**
 * Update an existing recipe
 */
export const updateRecipe = async (id, recipeData) => {
  const response = await apiClient.patch(`/recipes/${id}`, recipeData);
  return response.data;
};

/**
 * Delete a user-owned recipe
 */
export const deleteRecipe = async (id) => {
  const response = await apiClient.delete(`/recipes/${id}`);
  return response.data;
};

/**
 * Add recipe to user favourites
 */
export const addRecipeFavourite = async (id) => {
  const response = await apiClient.post(`/recipes/${id}/favourite`);
  return response.data;
};

/**
 * Remove recipe from user favourites
 */
export const removeRecipeFavourite = async (id) => {
  const response = await apiClient.delete(`/recipes/${id}/favourite`);
  return response.data;
};

/**
 * Send chat message to AI Kitchen Assistant
 */
export const sendAiChatMessage = async ({ message, conversationHistory = [], context = {} }) => {
  const response = await apiClient.post(
    '/ai/chat',
    { message, conversationHistory, context },
    { timeout: 45000 } // Extended timeout for conversational LLM generation
  );
  return response.data;
};

/**
 * Fetch AI Assistant kitchen context summary
 */
export const fetchAiContext = async () => {
  const response = await apiClient.get('/ai/context');
  return response.data;
};

/**
 * Generate a new structured recipe using AI
 */
export const generateAiRecipeApi = async (payload) => {
  const response = await apiClient.post('/ai/recipes/generate', payload, {
    timeout: 45000
  });
  return response.data;
};

/**
 * Modify an existing recipe using AI
 */
export const modifyAiRecipeApi = async (recipeId, payload) => {
  const response = await apiClient.post(`/ai/recipes/${recipeId}/modify`, payload, {
    timeout: 45000
  });
  return response.data;
};

/**
 * Suggest ingredient substitutions
 */
export const suggestSubstitutionsApi = async (payload) => {
  const response = await apiClient.post('/ai/substitutions', payload, {
    timeout: 30000
  });
  return response.data;
};

/**
 * Scale recipe serving size with non-linear guidance
 */
export const scaleRecipeServingsApi = async (recipeId, payload) => {
  const response = await apiClient.post(`/ai/recipes/${recipeId}/scale`, payload);
  return response.data;
};

// ==========================================
// Phase 7: Meal Planning & Inventory Deduction
// ==========================================

export const fetchMealPlans = async (params = {}) => {
  const response = await apiClient.get('/meal-plans', { params });
  return response.data;
};

export const fetchMealPlanById = async (id) => {
  const response = await apiClient.get(`/meal-plans/${id}`);
  return response.data;
};

export const createMealPlan = async (payload) => {
  const response = await apiClient.post('/meal-plans', payload);
  return response.data;
};

export const updateMealPlan = async (id, payload) => {
  const response = await apiClient.patch(`/meal-plans/${id}`, payload);
  return response.data;
};

export const deleteMealPlan = async (id) => {
  const response = await apiClient.delete(`/meal-plans/${id}`);
  return response.data;
};

export const skipMealPlan = async (id) => {
  const response = await apiClient.post(`/meal-plans/${id}/skip`);
  return response.data;
};

export const cancelMealPlan = async (id) => {
  const response = await apiClient.post(`/meal-plans/${id}/cancel`);
  return response.data;
};

export const fetchMealPlanRequirements = async (params = {}) => {
  const response = await apiClient.get('/meal-plans/requirements', { params });
  return response.data;
};

export const getCookPreview = async (id) => {
  const response = await apiClient.post(`/meal-plans/${id}/cook-preview`);
  return response.data;
};

export const cookMealPlan = async (id, payload = {}) => {
  const response = await apiClient.post(`/meal-plans/${id}/cook`, payload);
  return response.data;
};

export const reverseMealPlanConsumption = async (id) => {
  const response = await apiClient.post(`/meal-plans/${id}/reverse-consumption`);
  return response.data;
};

export const fetchDashboardMealSummary = async () => {
  const response = await apiClient.get('/meal-plans/dashboard-summary');
  return response.data;
};

// ====================================================
// Phase 8: Smart Shopping Lists & Cost Optimisation
// ====================================================

export const fetchShoppingLists = async (params = {}) => {
  const response = await apiClient.get('/shopping-lists', { params });
  return response.data;
};

export const createShoppingList = async (data) => {
  const response = await apiClient.post('/shopping-lists', data);
  return response.data;
};

export const fetchShoppingListById = async (id) => {
  const response = await apiClient.get(`/shopping-lists/${id}`);
  return response.data;
};

export const updateShoppingList = async (id, data) => {
  const response = await apiClient.patch(`/shopping-lists/${id}`, data);
  return response.data;
};

export const deleteShoppingList = async (id) => {
  const response = await apiClient.delete(`/shopping-lists/${id}`);
  return response.data;
};

export const addShoppingListItem = async (listId, data) => {
  const response = await apiClient.post(`/shopping-lists/${listId}/items`, data);
  return response.data;
};

export const addShoppingListItemsBulk = async (listId, items) => {
  const response = await apiClient.post(`/shopping-lists/${listId}/items/bulk`, { items });
  return response.data;
};

export const updateShoppingListItem = async (listId, itemId, data) => {
  const response = await apiClient.patch(`/shopping-lists/${listId}/items/${itemId}`, data);
  return response.data;
};

export const deleteShoppingListItem = async (listId, itemId) => {
  const response = await apiClient.delete(`/shopping-lists/${listId}/items/${itemId}`);
  return response.data;
};

export const purchaseShoppingListItem = async (listId, itemId, data) => {
  const response = await apiClient.post(`/shopping-lists/${listId}/items/${itemId}/purchase`, data);
  return response.data;
};

export const addPurchasedItemToInventory = async (listId, itemId, data = {}) => {
  const response = await apiClient.post(`/shopping-lists/${listId}/items/${itemId}/add-to-inventory`, data);
  return response.data;
};

export const generateShoppingListFromMealPlan = async (data) => {
  const response = await apiClient.post('/shopping-lists/generate-from-meal-plan', data);
  return response.data;
};

export const fetchShoppingListOptimisation = async (listId) => {
  const response = await apiClient.get(`/shopping-lists/${listId}/optimisation`);
  return response.data;
};

export const fetchAiShoppingAdvice = async (listId, data = {}) => {
  const response = await apiClient.post(`/shopping-lists/${listId}/ai-advice`, data);
  return response.data;
};

export const fetchIngredientPrices = async (params = {}) => {
  const response = await apiClient.get('/ingredient-prices', { params });
  return response.data;
};

export const recordIngredientPrice = async (data) => {
  const response = await apiClient.post('/ingredient-prices', data);
  return response.data;
};

export const fetchIngredientPriceTrends = async () => {
  const response = await apiClient.get('/ingredient-prices/trends');
  return response.data;
};

export const fetchBudgetSettings = async () => {
  const response = await apiClient.get('/shopping-lists/budget-settings');
  return response.data;
};

export const updateBudgetSettings = async (data) => {
  const response = await apiClient.patch('/shopping-lists/budget-settings', data);
  return response.data;
};

export const fetchDashboardShoppingSummary = async () => {
  const response = await apiClient.get('/shopping-lists/dashboard-summary');
  return response.data;
};

// ==========================================
// Phase 9: Nutrition & Dietary Tracking APIs
// ==========================================

export const fetchDietaryProfile = async () => {
  const response = await apiClient.get('/nutrition/profile');
  return response.data;
};

export const updateDietaryProfile = async (profileData) => {
  const response = await apiClient.patch('/nutrition/profile', profileData);
  return response.data;
};

export const fetchRecipeNutrition = async (recipeId, servings) => {
  const params = servings ? { servings } : {};
  const response = await apiClient.get(`/nutrition/recipes/${recipeId}`, { params });
  return response.data;
};

export const calculateRecipeNutrition = async (recipeId, data = {}) => {
  const response = await apiClient.post(`/nutrition/recipes/${recipeId}/calculate`, data);
  return response.data;
};

export const fetchDailyNutrition = async (date) => {
  const params = date ? { date } : {};
  const response = await apiClient.get('/nutrition/daily', { params });
  return response.data;
};

export const fetchWeeklyNutrition = async (startDate) => {
  const params = startDate ? { startDate } : {};
  const response = await apiClient.get('/nutrition/weekly', { params });
  return response.data;
};

export const fetchDashboardNutritionSummary = async () => {
  const response = await apiClient.get('/nutrition/dashboard-summary');
  return response.data;
};

export const fetchMealHistory = async (params = {}) => {
  const response = await apiClient.get('/nutrition/history', { params });
  return response.data;
};

export const logMealConsumption = async (consumptionData) => {
  const response = await apiClient.post('/nutrition/consumption', consumptionData);
  return response.data;
};

export const updateMealConsumption = async (id, updateData) => {
  const response = await apiClient.patch(`/nutrition/consumption/${id}`, updateData);
  return response.data;
};

export const deleteMealConsumption = async (id) => {
  const response = await apiClient.delete(`/nutrition/consumption/${id}`);
  return response.data;
};

export const askNutritionAssistant = async (data) => {
  const response = await apiClient.post('/nutrition/assistant', data);
  return response.data;
};

// ============================================================
// Phase 10: Food-Waste Analytics, Expiry Tracking & Reduction
// ============================================================

export const fetchExpiryOverview = async (params = {}) => {
  const response = await apiClient.get('/waste/expiry', { params });
  return response.data;
};

export const fetchWasteRecords = async (params = {}) => {
  const response = await apiClient.get('/waste/records', { params });
  return response.data;
};

export const recordFoodWaste = async (wasteData) => {
  const response = await apiClient.post('/waste/records', wasteData);
  return response.data;
};

export const reverseFoodWaste = async (id, data = {}) => {
  const response = await apiClient.post(`/waste/records/${id}/reverse`, data);
  return response.data;
};

export const fetchWasteAnalytics = async (params = {}) => {
  const response = await apiClient.get('/waste/analytics', { params });
  return response.data;
};

export const fetchAtRiskInventory = async () => {
  const response = await apiClient.get('/waste/at-risk');
  return response.data;
};

export const fetchExpiryRecipeSuggestions = async () => {
  const response = await apiClient.get('/waste/recipe-suggestions');
  return response.data;
};

export const fetchDashboardWasteSummary = async () => {
  const response = await apiClient.get('/waste/summary');
  return response.data;
};

export const fetchAiWasteAdvice = async (data) => {
  const response = await apiClient.post('/waste/ai-advice', data);
  return response.data;
};

export default apiClient;

