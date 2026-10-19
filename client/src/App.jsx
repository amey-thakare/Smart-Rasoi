import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import PublicRoute from './components/common/PublicRoute.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import RecipesPage from './pages/RecipesPage.jsx';
import AiAssistantPage from './pages/AiAssistantPage.jsx';
import MealPlannerPage from './pages/MealPlannerPage.jsx';
import ShoppingListPage from './pages/ShoppingListPage.jsx';
import NutritionPage from './pages/NutritionPage.jsx';
import BudgetWastePage from './pages/BudgetWastePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root redirect to /dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Public Authentication Routes (redirect to dashboard if already signed in) */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected Routes (redirect unauthenticated visitors to /login) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/recipes" element={<RecipesPage />} />
              <Route path="/ai-assistant" element={<AiAssistantPage />} />
              <Route path="/meal-planner" element={<MealPlannerPage />} />
              <Route path="/nutrition" element={<NutritionPage />} />
              <Route path="/shopping-list" element={<ShoppingListPage />} />
              <Route path="/shopping-lists" element={<Navigate to="/shopping-list" replace />} />

              <Route path="/budget-waste" element={<BudgetWastePage />} />

              <Route path="/settings" element={<SettingsPage />} />

              {/* Catch-all 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
