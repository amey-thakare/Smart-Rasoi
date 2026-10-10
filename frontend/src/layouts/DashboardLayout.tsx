import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuth';
import { ChefHat, ListTodo, LogOut, Package, Utensils } from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center gap-2 text-primary font-bold text-xl">
          <ChefHat /> Smart Rasoi
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/dashboard" className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition">
            <ListTodo size={18} /> Dashboard
          </Link>
          <Link to="/recipes" className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition">
            <Utensils size={18} /> Recipes
          </Link>
          <Link to="/inventory" className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition">
            <Package size={18} /> Inventory
          </Link>
          <Link to="/ai-assistant" className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition text-green-600 dark:text-green-400">
            <ChefHat size={18} /> AI Assistant
          </Link>
        </nav>
        <div className="p-4 border-t border-border">
          <button onClick={logout} className="flex items-center gap-2 text-destructive hover:underline w-full p-2">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
