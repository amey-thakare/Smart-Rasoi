import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import AiAssistant from './pages/AiAssistant';
import { useAuthStore } from './hooks/useAuth';
import { useEffect, useState } from 'react';
import { fetchApi } from './services/api';

const queryClient = new QueryClient();

export default function App() {
  const { setAuth, logout, token } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const user = await fetchApi('/auth/me');
          setAuth(user, token);
        } catch (e) {
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Login />} /> {/* TODO: Register component */}
          
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="recipes" element={<div>Recipes Module coming soon...</div>} />
            <Route path="inventory" element={<div>Inventory Module coming soon...</div>} />
            <Route path="ai-assistant" element={<AiAssistant />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
