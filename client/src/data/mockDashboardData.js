/**
 * Smart Rasoi - Demonstration Data (Phase 1)
 * NOTE: All records in this file are simulated demonstration entities.
 * In Phase 2+, these will be backed by SQLite and user sessions.
 */

export const mockDashboardMetrics = [
  {
    id: 'ingredients-tracked',
    title: 'Ingredients Tracked',
    value: '24 items',
    description: 'Across fridge, pantry & produce',
    iconName: 'PackageOpen',
    trend: '+4 added this week',
    isPositive: true
  },
  {
    id: 'expiring-soon',
    title: 'Expiring Soon',
    value: '3 items',
    description: 'Require attention within 48h',
    iconName: 'AlertTriangle',
    trend: 'Urgent priority',
    isWarning: true
  },
  {
    id: 'meals-planned',
    title: 'Meals Planned',
    value: '7 meals',
    description: 'Scheduled for the next 3 days',
    iconName: 'CalendarCheck',
    trend: 'Schedule on track',
    isPositive: true
  },
  {
    id: 'waste-avoided',
    title: 'Estimated Waste Avoided',
    value: '~1.8 kg',
    description: 'Saved via timely ingredient use',
    iconName: 'Leaf',
    trend: 'Based on consumption log',
    isNeutral: true
  }
];

export const mockInventoryPreview = [
  {
    id: 'inv-1',
    name: 'Tomatoes',
    category: 'Fresh Produce',
    quantity: '6',
    unit: 'pcs',
    daysRemaining: 1,
    location: 'Fridge Crisper'
  },
  {
    id: 'inv-2',
    name: 'Fresh Milk',
    category: 'Dairy',
    quantity: '1',
    unit: 'Litre',
    daysRemaining: 2,
    location: 'Fridge Top Shelf'
  },
  {
    id: 'inv-3',
    name: 'Baby Spinach',
    category: 'Greens',
    quantity: '250',
    unit: 'g',
    daysRemaining: 2,
    location: 'Crisper Drawer'
  },
  {
    id: 'inv-4',
    name: 'Paneer (Cottage Cheese)',
    category: 'Dairy',
    quantity: '400',
    unit: 'g',
    daysRemaining: 4,
    location: 'Dairy Compartment'
  },
  {
    id: 'inv-5',
    name: 'Basmati Rice',
    category: 'Pantry',
    quantity: '2',
    unit: 'kg',
    daysRemaining: 180,
    location: 'Dry Storage'
  },
  {
    id: 'inv-6',
    name: 'Green Bell Peppers',
    category: 'Fresh Produce',
    quantity: '3',
    unit: 'pcs',
    daysRemaining: 5,
    location: 'Crisper Drawer'
  }
];

export const mockFeaturedRecipes = [
  {
    id: 'rec-1',
    title: 'Fragrant Vegetable Pulao',
    category: 'Main Course / Lunch',
    prepTime: '30 mins',
    calories: 320,
    dietary: 'Vegetarian',
    estimatedCost: 120,
    imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=600&q=80',
    fallbackEmoji: '🍚',
    keyIngredients: ['Basmati Rice', 'Green Peas', 'Carrots', 'Whole Spices'],
    description: 'A comforting, lightly spiced one-pot rice pilaf loaded with vegetables. Perfect for utilizing pantry rice and fresh veggies.',
    utilizedFromStock: ['Basmati Rice', 'Green Bell Peppers']
  },
  {
    id: 'rec-2',
    title: 'Spiced Paneer Bhurji',
    category: 'Quick Meal / Breakfast',
    prepTime: '20 mins',
    calories: 280,
    dietary: 'High Protein',
    estimatedCost: 140,
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80',
    fallbackEmoji: '🍳',
    keyIngredients: ['Paneer', 'Tomatoes', 'Onions', 'Turmeric', 'Coriander'],
    description: 'Scrambled cottage cheese tossed with sauteed onions, ginger, and ripe tomatoes. High in protein and ready in under 20 minutes.',
    utilizedFromStock: ['Paneer', 'Tomatoes']
  },
  {
    id: 'rec-3',
    title: 'Roasted Tomato Basil Soup',
    category: 'Dinner / Appetizer',
    prepTime: '25 mins',
    calories: 180,
    dietary: 'Vegan / Low Cal',
    estimatedCost: 65,
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
    fallbackEmoji: '🥣',
    keyIngredients: ['Ripe Tomatoes', 'Garlic', 'Olive Oil', 'Fresh Basil'],
    description: 'Slow-roasted vine tomatoes blended with garlic and aromatic herbs. The best way to use up ripe tomatoes nearing their expiry.',
    utilizedFromStock: ['Tomatoes']
  }
];

export const mockUpcomingMeals = [
  {
    day: 'Today',
    dateLabel: 'Tuesday, 14 Oct',
    meals: [
      {
        mealType: 'Breakfast',
        title: 'Paneer Scramble & Multigrain Toast',
        time: '8:30 AM',
        calories: 310
      },
      {
        mealType: 'Lunch',
        title: 'Vegetable Pulao with Mint Raita',
        time: '1:15 PM',
        calories: 420
      },
      {
        mealType: 'Dinner',
        title: 'Roasted Tomato Soup & Warm Roti',
        time: '8:00 PM',
        calories: 240
      }
    ]
  },
  {
    day: 'Tomorrow',
    dateLabel: 'Wednesday, 15 Oct',
    meals: [
      {
        mealType: 'Breakfast',
        title: 'Rolled Oats with Cinnamon & Apple',
        time: '8:30 AM',
        calories: 290
      },
      {
        mealType: 'Lunch',
        title: 'Palak Dal & Steamed Basmati Rice',
        time: '1:00 PM',
        calories: 380
      },
      {
        mealType: 'Dinner',
        title: 'Sauteed Bell Pepper Paneer Wrap',
        time: '8:15 PM',
        calories: 360
      }
    ]
  }
];

export const mockQuickActions = [
  {
    id: 'qa-inventory',
    title: 'Add Ingredients',
    description: 'Log new grocery purchases or pantry items.',
    path: '/inventory',
    iconName: 'PlusCircle',
    badgeText: 'Manage Stock'
  },
  {
    id: 'qa-recipes',
    title: 'Discover Recipes',
    description: 'Find meals you can cook with items at home.',
    path: '/recipes',
    iconName: 'ChefHat',
    badgeText: 'Smart Match'
  },
  {
    id: 'qa-meal-plan',
    title: 'Plan a Meal',
    description: 'Schedule dishes for breakfast, lunch, or dinner.',
    path: '/meal-planner',
    iconName: 'CalendarPlus',
    badgeText: 'Weekly Plan'
  },
  {
    id: 'qa-ai-chef',
    title: 'Ask the AI Chef',
    description: 'Get recipe adaptations and substitution ideas.',
    path: '/ai-assistant',
    iconName: 'Sparkles',
    badgeText: 'Gemini AI'
  }
];
