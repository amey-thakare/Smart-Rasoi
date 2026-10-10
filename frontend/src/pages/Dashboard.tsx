import { useEffect, useState } from 'react';
import { useAuthStore } from '../hooks/useAuth';
import { fetchApi } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Utensils, IndianRupee, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // In a real app, this would fetch from /api/v1/dashboard/summary
    // Mocking for now to show layout
    setStats({
      totalInventory: 24,
      expiringSoon: 3,
      savedRecipes: 12,
      weeklySpent: 1250,
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome back, {user?.name || 'Chef'}!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalInventory || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.expiringSoon || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved Recipes</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.savedRecipes || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Spent</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats?.weeklySpent || 0}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Your smart cooking assistant has recommendations for tonight's dinner based on your expiring spinach.</p>
            {/* Recommendation list would go here */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Nutrition Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Nutrition charts will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
