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
import PlaceholderPage from './pages/PlaceholderPage.jsx';
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

              <Route
                path="/nutrition"
                element={
                  <PlaceholderPage
                    title="Nutritional Intake Analysis"
                    description="Monitor macro and micronutrient distributions across your planned and consumed meals to maintain a healthy, balanced lifestyle."
                    iconName="Apple"
                    phase="Phase 4"
                    upcomingFeatures={[
                      'Daily and weekly caloric breakdown charts',
                      'Macronutrient balance monitoring (Proteins, Carbs, Fats)',
                      'Nutritional shortfall and excess alerts',
                      'Dietary goal tracking tailored to household members'
                    ]}
                  />
                }
              />

              <Route path="/shopping-list" element={<ShoppingListPage />} />
              <Route path="/shopping-lists" element={<Navigate to="/shopping-list" replace />} />

              <Route
                path="/budget-waste"
                element={
                  <PlaceholderPage
                    title="Grocery Budget & Food Waste Analytics"
                    description="Gain insights into monthly grocery spending, identify trends in avoidable food waste, and discover practical ways to save money."
                    iconName="PiggyBank"
                    phase="Phase 4"
                    upcomingFeatures={[
                      'Monthly grocery budget limits and expense tracking',
                      'Historical log of discarded ingredients and root cause tagging',
                      'Estimated monetary savings achieved through waste prevention',
                      'Smart purchase quantity recommendations'
                    ]}
                  />
                }
              />

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
