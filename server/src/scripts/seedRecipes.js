import prisma from '../config/prisma.js';

export const SEED_RECIPES = [
  {
    title: 'Fragrant Vegetable Pulao',
    category: 'Lunch',
    cuisine: 'Indian',
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    servings: 3,
    difficulty: 'Easy',
    description: 'A comforting, lightly spiced one-pot rice pilaf loaded with vegetables. Perfect for utilizing pantry rice and fresh veggies.',
    imageUrl: '/images/recipes/vegetable-pulao.jpg',
    instructions: '1. Rinse and soak Basmati Rice for 20 minutes.\n2. Heat oil or ghee in a pan, add cumin seeds and sliced onions until translucent.\n3. Add diced carrots and peas, sauté for 2 minutes.\n4. Add drained rice and 3.5 cups water with salt.\n5. Cover and simmer on low heat for 15 minutes until liquid is absorbed.',
    ingredients: [
      { name: 'Basmati Rice', quantity: 2, unit: 'cups', isOptional: false },
      { name: 'Green Peas', quantity: 1, unit: 'cups', isOptional: false },
      { name: 'Carrots', quantity: 1, unit: 'cups', isOptional: false },
      { name: 'Onions', quantity: 1, unit: 'pcs', isOptional: false },
      { name: 'Cumin Seeds', quantity: 1, unit: 'tsp', isOptional: false },
      { name: 'Ghee', quantity: 2, unit: 'tbsp', isOptional: true }
    ]
  },
  {
    title: 'Spiced Paneer Bhurji',
    category: 'Breakfast',
    cuisine: 'Indian',
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    servings: 2,
    difficulty: 'Easy',
    description: 'Scrambled cottage cheese tossed with sautéed onions, tomatoes, and aromatic Indian spices. High in protein and ready in minutes.',
    imageUrl: '/images/recipes/paneer-bhurji.jpg',
    instructions: '1. Crumble fresh paneer by hand.\n2. Heat oil in a pan, sauté finely chopped onions and green chilies until soft.\n3. Add chopped tomatoes and turmeric; cook until mushy.\n4. Fold in crumbled paneer and salt. Sauté gently on medium heat for 2-3 minutes.\n5. Garnish with chopped coriander and serve hot with toast or roti.',
    ingredients: [
      { name: 'Paneer', quantity: 250, unit: 'g', isOptional: false },
      { name: 'Tomatoes', quantity: 2, unit: 'pcs', isOptional: false },
      { name: 'Onions', quantity: 1, unit: 'pcs', isOptional: false },
      { name: 'Green Chilies', quantity: 2, unit: 'pcs', isOptional: false },
      { name: 'Turmeric Powder', quantity: 0.5, unit: 'tsp', isOptional: false },
      { name: 'Coriander Leaves', quantity: 2, unit: 'tbsp', isOptional: true }
    ]
  },
  {
    title: 'Classic Tomato Basil Pasta',
    category: 'Dinner',
    cuisine: 'Italian',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 2,
    difficulty: 'Easy',
    description: 'Rich, aromatic tomato sauce simmered with garlic and tossed with al dente pasta and sweet fresh basil leaves.',
    imageUrl: '/images/recipes/tomato-basil-pasta.jpg',
    instructions: '1. Boil pasta in generously salted water until al dente.\n2. In a skillet, heat olive oil and gently sauté sliced garlic until fragrant.\n3. Add chopped fresh tomatoes and simmer for 10 minutes until a rich sauce forms.\n4. Toss cooked pasta into the sauce with fresh torn basil leaves.\n5. Serve immediately with a sprinkle of grated parmesan cheese.',
    ingredients: [
      { name: 'Pasta', quantity: 200, unit: 'g', isOptional: false },
      { name: 'Tomatoes', quantity: 4, unit: 'pcs', isOptional: false },
      { name: 'Garlic', quantity: 4, unit: 'cloves', isOptional: false },
      { name: 'Olive Oil', quantity: 2, unit: 'tbsp', isOptional: false },
      { name: 'Fresh Basil', quantity: 10, unit: 'leaves', isOptional: false },
      { name: 'Parmesan Cheese', quantity: 2, unit: 'tbsp', isOptional: true }
    ]
  },
  {
    title: 'Homestyle Dal Tadka',
    category: 'Vegetarian',
    cuisine: 'Indian',
    prepTimeMinutes: 10,
    cookTimeMinutes: 25,
    servings: 4,
    difficulty: 'Easy',
    description: 'Comforting yellow lentils tempered with ghee, cumin seeds, garlic, and ripe tomatoes. A staple vegetarian meal.',
    imageUrl: '/images/recipes/dal-tadka.jpg',
    instructions: '1. Pressure cook Toor Dal with water, turmeric, and salt for 3-4 whistles until soft.\n2. In a small pan, heat ghee and temper cumin seeds and crushed garlic.\n3. Add onions and chopped tomatoes, cooking until tomatoes release oil.\n4. Pour the tadka over cooked dal and simmer for 5 minutes.\n5. Serve warm with steamed basmati rice.',
    ingredients: [
      { name: 'Toor Dal', quantity: 1, unit: 'cups', isOptional: false },
      { name: 'Tomatoes', quantity: 2, unit: 'pcs', isOptional: false },
      { name: 'Onions', quantity: 1, unit: 'pcs', isOptional: false },
      { name: 'Garlic', quantity: 4, unit: 'cloves', isOptional: false },
      { name: 'Cumin Seeds', quantity: 1, unit: 'tsp', isOptional: false },
      { name: 'Ghee', quantity: 1, unit: 'tbsp', isOptional: false },
      { name: 'Turmeric Powder', quantity: 0.5, unit: 'tsp', isOptional: false }
    ]
  },
  {
    title: 'Crispy Oven-Baked Potato Wedges',
    category: 'Snacks',
    cuisine: 'Western',
    prepTimeMinutes: 10,
    cookTimeMinutes: 25,
    servings: 3,
    difficulty: 'Easy',
    description: 'Golden, crispy potato wedges seasoned with garlic powder, paprika, and sea salt. Healthier and full of flavor.',
    imageUrl: '/images/recipes/potato-wedges.jpg',
    instructions: '1. Wash potatoes thoroughly and cut into uniform wedges.\n2. Toss wedges in a bowl with olive oil, salt, garlic powder, and paprika.\n3. Arrange in a single layer on a lined baking tray.\n4. Bake at 200°C (400°F) for 25 minutes, flipping halfway until golden and crispy.\n5. Serve hot with your favorite dip.',
    ingredients: [
      { name: 'Potatoes', quantity: 3, unit: 'pcs', isOptional: false },
      { name: 'Olive Oil', quantity: 2, unit: 'tbsp', isOptional: false },
      { name: 'Garlic Powder', quantity: 1, unit: 'tsp', isOptional: false },
      { name: 'Paprika', quantity: 0.5, unit: 'tsp', isOptional: false },
      { name: 'Black Pepper', quantity: 0.5, unit: 'tsp', isOptional: true }
    ]
  },
  {
    title: 'Quick Masala Oats',
    category: 'Quick Meals',
    cuisine: 'Indian',
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    servings: 1,
    difficulty: 'Easy',
    description: 'Savory rolled oats cooked with fresh tomatoes, green peas, and mild spices. Ready in under 15 minutes.',
    imageUrl: '/images/recipes/masala-oats.jpg',
    instructions: '1. Sauté finely chopped onions and tomatoes in a teaspoon of oil.\n2. Add green peas, turmeric powder, and salt.\n3. Pour in 2 cups of water and bring to a rolling boil.\n4. Stir in oats and cook for 3-4 minutes until creamy.\n5. Serve warm as a hearty, fiber-rich breakfast or snack.',
    ingredients: [
      { name: 'Oats', quantity: 1, unit: 'cups', isOptional: false },
      { name: 'Tomatoes', quantity: 1, unit: 'pcs', isOptional: false },
      { name: 'Onions', quantity: 0.5, unit: 'pcs', isOptional: false },
      { name: 'Green Peas', quantity: 0.25, unit: 'cups', isOptional: false },
      { name: 'Turmeric Powder', quantity: 0.25, unit: 'tsp', isOptional: false }
    ]
  },
  {
    title: 'Palak Paneer',
    category: 'Dinner',
    cuisine: 'Indian',
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    servings: 3,
    difficulty: 'Medium',
    description: 'Tender cottage cheese cubes simmered in a vibrant, spiced baby spinach puree. Rich in iron and calcium.',
    imageUrl: '/images/recipes/palak-paneer.jpg',
    instructions: '1. Blanch spinach in boiling water for 2 minutes, then plunge into cold water and puree.\n2. Sauté chopped onions, garlic, and tomato puree until cooked through.\n3. Pour in the spinach puree and simmer for 5 minutes.\n4. Gently stir in paneer cubes and garam masala.\n5. Simmer for 2 minutes, swirl with cream if desired, and serve with naan or roti.',
    ingredients: [
      { name: 'Spinach', quantity: 300, unit: 'g', isOptional: false },
      { name: 'Paneer', quantity: 200, unit: 'g', isOptional: false },
      { name: 'Onions', quantity: 1, unit: 'pcs', isOptional: false },
      { name: 'Tomatoes', quantity: 1, unit: 'pcs', isOptional: false },
      { name: 'Garlic', quantity: 5, unit: 'cloves', isOptional: false },
      { name: 'Garam Masala', quantity: 0.5, unit: 'tsp', isOptional: false },
      { name: 'Fresh Cream', quantity: 1, unit: 'tbsp', isOptional: true }
    ]
  },
  {
    title: 'Masala Scrambled Eggs (Akuri)',
    category: 'Breakfast',
    cuisine: 'Indian',
    prepTimeMinutes: 5,
    cookTimeMinutes: 8,
    servings: 2,
    difficulty: 'Easy',
    description: 'Parsi-style spiced soft scrambled eggs packed with onions, tomatoes, and green chilies. Soft, creamy, and satisfying.',
    imageUrl: '/images/recipes/scrambled-eggs-akuri.jpg',
    instructions: '1. Whisk eggs in a bowl with a splash of milk and salt.\n2. Melt butter in a non-stick pan, sauté onions, green chilies, and tomatoes until soft.\n3. Lower heat, pour in whisked eggs.\n4. Stir continuously with a spatula until soft curds form.\n5. Remove while still slightly creamy and serve immediately on buttered toast.',
    ingredients: [
      { name: 'Eggs', quantity: 3, unit: 'pcs', isOptional: false },
      { name: 'Onions', quantity: 1, unit: 'pcs', isOptional: false },
      { name: 'Tomatoes', quantity: 1, unit: 'pcs', isOptional: false },
      { name: 'Green Chilies', quantity: 1, unit: 'pcs', isOptional: false },
      { name: 'Butter', quantity: 1, unit: 'tbsp', isOptional: false },
      { name: 'Milk', quantity: 2, unit: 'tbsp', isOptional: true }
    ]
  },
  {
    title: 'Garlic Butter Sautéed Mushrooms',
    category: 'Snacks',
    cuisine: 'Continental',
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    servings: 2,
    difficulty: 'Easy',
    description: 'Tender button mushrooms seared in garlic-infused butter with cracked black pepper and fresh herbs.',
    imageUrl: '/images/recipes/garlic-mushrooms.jpg',
    instructions: '1. Wipe mushrooms clean with a damp cloth and slice in half.\n2. Melt butter in a heavy skillet over medium-high heat.\n3. Add mushrooms in a single layer and sear without disturbing for 3 minutes.\n4. Add minced garlic, salt, and black pepper, tossing for another 2 minutes.\n5. Garnish with chopped parsley and serve warm.',
    ingredients: [
      { name: 'Mushrooms', quantity: 250, unit: 'g', isOptional: false },
      { name: 'Garlic', quantity: 4, unit: 'cloves', isOptional: false },
      { name: 'Butter', quantity: 2, unit: 'tbsp', isOptional: false },
      { name: 'Black Pepper', quantity: 0.5, unit: 'tsp', isOptional: false },
      { name: 'Parsley', quantity: 1, unit: 'tbsp', isOptional: true }
    ]
  },
  {
    title: 'Aloo Jeera (Cumin Roasted Potatoes)',
    category: 'Vegetarian',
    cuisine: 'Indian',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 3,
    difficulty: 'Easy',
    description: 'Boiled potatoes pan-roasted with fragrant cumin seeds, green chilies, and turmeric. Simple everyday comfort food.',
    imageUrl: '/images/recipes/aloo-jeera.jpg',
    instructions: '1. Boil and peel potatoes, then cut into bite-sized cubes.\n2. Heat oil, add cumin seeds until they splutter and turn fragrant.\n3. Add chopped green chilies, turmeric powder, and potato cubes.\n4. Toss on medium flame for 5-7 minutes until edges are crisp and golden.\n5. Season with salt and fresh coriander leaves.',
    ingredients: [
      { name: 'Potatoes', quantity: 3, unit: 'pcs', isOptional: false },
      { name: 'Cumin Seeds', quantity: 1.5, unit: 'tsp', isOptional: false },
      { name: 'Turmeric Powder', quantity: 0.5, unit: 'tsp', isOptional: false },
      { name: 'Green Chilies', quantity: 2, unit: 'pcs', isOptional: false },
      { name: 'Mustard Oil', quantity: 2, unit: 'tbsp', isOptional: false },
      { name: 'Coriander Leaves', quantity: 2, unit: 'tbsp', isOptional: true }
    ]
  },
  {
    title: 'Quick Vegetable Fried Rice',
    category: 'Quick Meals',
    cuisine: 'Asian',
    prepTimeMinutes: 10,
    cookTimeMinutes: 12,
    servings: 2,
    difficulty: 'Easy',
    description: 'A swift wok-tossed fried rice using leftover cold rice, diced carrots, bell peppers, garlic, and soy sauce.',
    imageUrl: '/images/recipes/vegetable-fried-rice.jpg',
    instructions: '1. Use cold cooked rice for best texture.\n2. Heat a wok with oil on high heat, add minced garlic and finely diced veggies.\n3. Stir fry briskly for 2 minutes keeping veggies crisp.\n4. Add rice, soy sauce, and a pinch of black pepper.\n5. Toss vigorously on high heat for 3 minutes until steaming hot.',
    ingredients: [
      { name: 'Basmati Rice', quantity: 2, unit: 'cups', isOptional: false },
      { name: 'Carrots', quantity: 0.5, unit: 'cups', isOptional: false },
      { name: 'Green Bell Peppers', quantity: 0.5, unit: 'cups', isOptional: false },
      { name: 'Garlic', quantity: 3, unit: 'cloves', isOptional: false },
      { name: 'Soy Sauce', quantity: 2, unit: 'tbsp', isOptional: false },
      { name: 'Spring Onions', quantity: 2, unit: 'tbsp', isOptional: true }
    ]
  },
  {
    title: 'Fresh Fruit Medley with Mint',
    category: 'Breakfast',
    cuisine: 'Continental',
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    servings: 2,
    difficulty: 'Easy',
    description: 'Refreshing bowl of seasonal apples, bananas, and oranges tossed with honey and finely chopped garden mint.',
    imageUrl: '/images/recipes/fruit-medley.jpg',
    instructions: '1. Peel and chop apples, bananas, and oranges into bite-sized chunks.\n2. Place fruit into a chilled mixing bowl.\n3. Drizzle with honey and toss gently with finely sliced fresh mint leaves.\n4. Serve immediately chilled.',
    ingredients: [
      { name: 'Apples', quantity: 1, unit: 'pcs', isOptional: false },
      { name: 'Bananas', quantity: 2, unit: 'pcs', isOptional: false },
      { name: 'Oranges', quantity: 1, unit: 'pcs', isOptional: false },
      { name: 'Fresh Mint', quantity: 6, unit: 'leaves', isOptional: false },
      { name: 'Honey', quantity: 1, unit: 'tbsp', isOptional: true }
    ]
  }
];

/**
 * Seed shared recipes idempotently without touching user-created recipes
 */
export async function seedSharedRecipes() {
  console.log(`[Seed] Processing ${SEED_RECIPES.length} shared recipes...`);
  let createdCount = 0;
  let updatedCount = 0;

  for (const recipeData of SEED_RECIPES) {
    const { ingredients, ...recipeFields } = recipeData;

    // Check if shared recipe already exists by title and userId = null
    const existing = await prisma.recipe.findFirst({
      where: {
        title: recipeFields.title,
        userId: null
      },
      include: {
        ingredients: true
      }
    });

    if (existing) {
      // Update recipe fields and ensure ingredients are current
      await prisma.$transaction(async (tx) => {
        await tx.recipe.update({
          where: { id: existing.id },
          data: {
            ...recipeFields,
            isPublic: true,
            userId: null
          }
        });

        // Replace ingredients to ensure consistency
        await tx.recipeIngredient.deleteMany({
          where: { recipeId: existing.id }
        });

        await tx.recipeIngredient.createMany({
          data: ingredients.map((ing) => ({
            recipeId: existing.id,
            name: ing.name.trim(),
            quantity: Number(ing.quantity),
            unit: ing.unit.trim(),
            isOptional: Boolean(ing.isOptional)
          }))
        });
      });
      updatedCount++;
    } else {
      // Create new shared recipe
      await prisma.$transaction(async (tx) => {
        const newRecipe = await tx.recipe.create({
          data: {
            ...recipeFields,
            isPublic: true,
            userId: null
          }
        });

        await tx.recipeIngredient.createMany({
          data: ingredients.map((ing) => ({
            recipeId: newRecipe.id,
            name: ing.name.trim(),
            quantity: Number(ing.quantity),
            unit: ing.unit.trim(),
            isOptional: Boolean(ing.isOptional)
          }))
        });
      });
      createdCount++;
    }
  }

  console.log(`[Seed] Done! Created: ${createdCount}, Updated: ${updatedCount} shared recipes.`);
}

// Execute standalone if called directly
if (process.argv[1]?.endsWith('seedRecipes.js')) {
  seedSharedRecipes()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('[Seed] Error seeding recipes:', error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
