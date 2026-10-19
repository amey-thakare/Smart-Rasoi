/**
 * Smart Rasoi - Phase 9 Nutrition Reference Dataset
 * 
 * Nutritional values per 100 grams of standard edible portion.
 * Grounded in Indian Food Composition Tables (IFCT) and USDA FoodData Central.
 * 
 * All values are deterministic reference estimates for guidance only.
 */

export const INGREDIENT_NUTRITION_PER_100G = {
  // Grains & Flours
  'rice': {
    name: 'Rice (Raw White / Basmati)',
    calories: 365,
    proteinGrams: 7.1,
    carbohydratesGrams: 80.0,
    fatGrams: 0.7,
    fiberGrams: 1.3,
    sugarGrams: 0.1,
    sodiumMilligrams: 5,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 185
  },
  'brown rice': {
    name: 'Brown Rice (Raw)',
    calories: 367,
    proteinGrams: 7.5,
    carbohydratesGrams: 76.2,
    fatGrams: 2.7,
    fiberGrams: 3.4,
    sugarGrams: 0.7,
    sodiumMilligrams: 7,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 190
  },
  'wheat flour': {
    name: 'Whole Wheat Flour (Atta)',
    calories: 340,
    proteinGrams: 13.2,
    carbohydratesGrams: 72.0,
    fatGrams: 2.5,
    fiberGrams: 10.7,
    sugarGrams: 0.4,
    sodiumMilligrams: 5,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 120
  },
  'pasta': {
    name: 'Pasta (Dry Semolina)',
    calories: 371,
    proteinGrams: 13.0,
    carbohydratesGrams: 74.7,
    fatGrams: 1.5,
    fiberGrams: 3.2,
    sugarGrams: 2.7,
    sodiumMilligrams: 6,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 100
  },
  'oats': {
    name: 'Rolled Oats',
    calories: 389,
    proteinGrams: 16.9,
    carbohydratesGrams: 66.3,
    fatGrams: 6.9,
    fiberGrams: 10.6,
    sugarGrams: 0.0,
    sodiumMilligrams: 2,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 90
  },
  'suji': {
    name: 'Semolina (Suji/Rava)',
    calories: 360,
    proteinGrams: 12.7,
    carbohydratesGrams: 72.8,
    fatGrams: 1.1,
    fiberGrams: 3.9,
    sugarGrams: 0.1,
    sodiumMilligrams: 1,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 160
  },
  'poha': {
    name: 'Flattened Rice (Poha)',
    calories: 346,
    proteinGrams: 6.6,
    carbohydratesGrams: 77.3,
    fatGrams: 1.2,
    fiberGrams: 0.7,
    sugarGrams: 0.0,
    sodiumMilligrams: 10,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 60
  },

  // Pulses & Legumes
  'toor dal': {
    name: 'Pigeon Pea (Toor / Arhar Dal)',
    calories: 343,
    proteinGrams: 22.3,
    carbohydratesGrams: 62.8,
    fatGrams: 1.5,
    fiberGrams: 15.0,
    sugarGrams: 3.0,
    sodiumMilligrams: 17,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 200
  },
  'moong dal': {
    name: 'Split Yellow Mung (Moong Dal)',
    calories: 347,
    proteinGrams: 24.0,
    carbohydratesGrams: 63.0,
    fatGrams: 1.2,
    fiberGrams: 16.3,
    sugarGrams: 2.0,
    sodiumMilligrams: 15,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 200
  },
  'chana dal': {
    name: 'Split Bengal Gram (Chana Dal)',
    calories: 364,
    proteinGrams: 20.8,
    carbohydratesGrams: 59.8,
    fatGrams: 5.6,
    fiberGrams: 18.3,
    sugarGrams: 4.0,
    sodiumMilligrams: 24,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 200
  },
  'urad dal': {
    name: 'Black Gram (Urad Dal)',
    calories: 341,
    proteinGrams: 25.2,
    carbohydratesGrams: 58.9,
    fatGrams: 1.6,
    fiberGrams: 18.3,
    sugarGrams: 2.5,
    sodiumMilligrams: 38,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 200
  },
  'masoor dal': {
    name: 'Red Lentils (Masoor Dal)',
    calories: 343,
    proteinGrams: 24.6,
    carbohydratesGrams: 63.4,
    fatGrams: 1.1,
    fiberGrams: 10.7,
    sugarGrams: 2.0,
    sodiumMilligrams: 12,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 200
  },
  'chickpeas': {
    name: 'Chickpeas (Kabuli Chana)',
    calories: 364,
    proteinGrams: 19.3,
    carbohydratesGrams: 60.7,
    fatGrams: 6.0,
    fiberGrams: 17.4,
    sugarGrams: 10.7,
    sodiumMilligrams: 24,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 200
  },
  'kidney beans': {
    name: 'Red Kidney Beans (Rajma)',
    calories: 333,
    proteinGrams: 23.6,
    carbohydratesGrams: 60.0,
    fatGrams: 0.8,
    fiberGrams: 24.9,
    sugarGrams: 2.2,
    sodiumMilligrams: 24,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 190
  },

  // Dairy & Alternatives
  'paneer': {
    name: 'Indian Cottage Cheese (Paneer)',
    calories: 265,
    proteinGrams: 18.3,
    carbohydratesGrams: 1.2,
    fatGrams: 20.8,
    fiberGrams: 0.0,
    sugarGrams: 1.2,
    sodiumMilligrams: 18,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 150
  },
  'milk': {
    name: 'Cow Milk (Full Cream)',
    calories: 62,
    proteinGrams: 3.2,
    carbohydratesGrams: 4.8,
    fatGrams: 3.4,
    fiberGrams: 0.0,
    sugarGrams: 4.8,
    sodiumMilligrams: 44,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 240
  },
  'curd': {
    name: 'Plain Yogurt / Curd (Dahi)',
    calories: 61,
    proteinGrams: 3.5,
    carbohydratesGrams: 4.7,
    fatGrams: 3.3,
    fiberGrams: 0.0,
    sugarGrams: 4.7,
    sodiumMilligrams: 46,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 240
  },
  'ghee': {
    name: 'Clarified Butter (Desi Ghee)',
    calories: 900,
    proteinGrams: 0.0,
    carbohydratesGrams: 0.0,
    fatGrams: 100.0,
    fiberGrams: 0.0,
    sugarGrams: 0.0,
    sodiumMilligrams: 2,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 220
  },
  'butter': {
    name: 'Butter (Unsalted)',
    calories: 717,
    proteinGrams: 0.9,
    carbohydratesGrams: 0.1,
    fatGrams: 81.1,
    fiberGrams: 0.0,
    sugarGrams: 0.1,
    sodiumMilligrams: 11,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 225
  },
  'cheese': {
    name: 'Cheddar / Processed Cheese',
    calories: 403,
    proteinGrams: 24.9,
    carbohydratesGrams: 1.3,
    fatGrams: 33.1,
    fiberGrams: 0.0,
    sugarGrams: 0.5,
    sodiumMilligrams: 621,
    defaultPieceWeightGrams: 28,
    cupWeightGrams: 115
  },
  'parmesan cheese': {
    name: 'Parmesan Cheese (Grated)',
    calories: 431,
    proteinGrams: 38.4,
    carbohydratesGrams: 4.1,
    fatGrams: 28.6,
    fiberGrams: 0.0,
    sugarGrams: 0.9,
    sodiumMilligrams: 1529,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 100
  },

  // Vegetables & Aromatics
  'potato': {
    name: 'Potato (Raw)',
    calories: 77,
    proteinGrams: 2.0,
    carbohydratesGrams: 17.5,
    fatGrams: 0.1,
    fiberGrams: 2.2,
    sugarGrams: 0.8,
    sodiumMilligrams: 6,
    defaultPieceWeightGrams: 150,
    cupWeightGrams: 150
  },
  'onion': {
    name: 'Onion (Raw)',
    calories: 40,
    proteinGrams: 1.1,
    carbohydratesGrams: 9.3,
    fatGrams: 0.1,
    fiberGrams: 1.7,
    sugarGrams: 4.2,
    sodiumMilligrams: 4,
    defaultPieceWeightGrams: 110,
    cupWeightGrams: 160
  },
  'tomato': {
    name: 'Tomato (Ripe Red)',
    calories: 18,
    proteinGrams: 0.9,
    carbohydratesGrams: 3.9,
    fatGrams: 0.2,
    fiberGrams: 1.2,
    sugarGrams: 2.6,
    sodiumMilligrams: 5,
    defaultPieceWeightGrams: 90,
    cupWeightGrams: 180
  },
  'green peas': {
    name: 'Green Peas (Fresh/Frozen)',
    calories: 81,
    proteinGrams: 5.4,
    carbohydratesGrams: 14.5,
    fatGrams: 0.4,
    fiberGrams: 5.7,
    sugarGrams: 5.7,
    sodiumMilligrams: 5,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 145
  },
  'carrot': {
    name: 'Carrot (Raw)',
    calories: 41,
    proteinGrams: 0.9,
    carbohydratesGrams: 9.6,
    fatGrams: 0.2,
    fiberGrams: 2.8,
    sugarGrams: 4.7,
    sodiumMilligrams: 69,
    defaultPieceWeightGrams: 70,
    cupWeightGrams: 128
  },
  'spinach': {
    name: 'Spinach (Palak)',
    calories: 23,
    proteinGrams: 2.9,
    carbohydratesGrams: 3.6,
    fatGrams: 0.4,
    fiberGrams: 2.2,
    sugarGrams: 0.4,
    sodiumMilligrams: 79,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 30
  },
  'cauliflower': {
    name: 'Cauliflower (Gobi)',
    calories: 25,
    proteinGrams: 1.9,
    carbohydratesGrams: 5.0,
    fatGrams: 0.3,
    fiberGrams: 2.0,
    sugarGrams: 1.9,
    sodiumMilligrams: 30,
    defaultPieceWeightGrams: 500,
    cupWeightGrams: 100
  },
  'cabbage': {
    name: 'Cabbage (Green)',
    calories: 25,
    proteinGrams: 1.3,
    carbohydratesGrams: 5.8,
    fatGrams: 0.1,
    fiberGrams: 2.5,
    sugarGrams: 3.2,
    sodiumMilligrams: 18,
    defaultPieceWeightGrams: 800,
    cupWeightGrams: 89
  },
  'capsicum': {
    name: 'Bell Pepper / Capsicum (Shimla Mirch)',
    calories: 26,
    proteinGrams: 1.0,
    carbohydratesGrams: 6.0,
    fatGrams: 0.3,
    fiberGrams: 2.1,
    sugarGrams: 4.2,
    sodiumMilligrams: 3,
    defaultPieceWeightGrams: 120,
    cupWeightGrams: 150
  },
  'garlic': {
    name: 'Garlic (Raw Cloves)',
    calories: 149,
    proteinGrams: 6.4,
    carbohydratesGrams: 33.1,
    fatGrams: 0.5,
    fiberGrams: 2.1,
    sugarGrams: 1.0,
    sodiumMilligrams: 17,
    defaultPieceWeightGrams: 3, // per clove
    cupWeightGrams: 136
  },
  'ginger': {
    name: 'Ginger Root (Raw)',
    calories: 80,
    proteinGrams: 1.8,
    carbohydratesGrams: 17.8,
    fatGrams: 0.8,
    fiberGrams: 2.0,
    sugarGrams: 1.7,
    sodiumMilligrams: 13,
    defaultPieceWeightGrams: 15, // 1 inch piece
    cupWeightGrams: 100
  },
  'green chilies': {
    name: 'Green Chilies (Hari Mirch)',
    calories: 40,
    proteinGrams: 2.0,
    carbohydratesGrams: 9.5,
    fatGrams: 0.2,
    fiberGrams: 1.5,
    sugarGrams: 5.3,
    sodiumMilligrams: 7,
    defaultPieceWeightGrams: 5,
    cupWeightGrams: 150
  },
  'coriander leaves': {
    name: 'Fresh Coriander / Cilantro Leaves',
    calories: 23,
    proteinGrams: 2.1,
    carbohydratesGrams: 3.7,
    fatGrams: 0.5,
    fiberGrams: 2.8,
    sugarGrams: 0.9,
    sodiumMilligrams: 46,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 16
  },
  'fresh basil': {
    name: 'Fresh Basil Leaves',
    calories: 22,
    proteinGrams: 3.2,
    carbohydratesGrams: 2.7,
    fatGrams: 0.6,
    fiberGrams: 1.6,
    sugarGrams: 0.3,
    sodiumMilligrams: 4,
    defaultPieceWeightGrams: 0.5, // per leaf
    cupWeightGrams: 20
  },

  // Oils & Fats
  'cooking oil': {
    name: 'Vegetable / Sunflower / Mustard Oil',
    calories: 884,
    proteinGrams: 0.0,
    carbohydratesGrams: 0.0,
    fatGrams: 100.0,
    fiberGrams: 0.0,
    sugarGrams: 0.0,
    sodiumMilligrams: 0,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 218
  },
  'olive oil': {
    name: 'Extra Virgin Olive Oil',
    calories: 884,
    proteinGrams: 0.0,
    carbohydratesGrams: 0.0,
    fatGrams: 100.0,
    fiberGrams: 0.0,
    sugarGrams: 0.0,
    sodiumMilligrams: 2,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 216
  },

  // Spices & Seasonings
  'cumin seeds': {
    name: 'Cumin Seeds (Jeera)',
    calories: 375,
    proteinGrams: 17.8,
    carbohydratesGrams: 44.2,
    fatGrams: 22.3,
    fiberGrams: 10.5,
    sugarGrams: 2.3,
    sodiumMilligrams: 168,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 100
  },
  'mustard seeds': {
    name: 'Mustard Seeds (Rai)',
    calories: 508,
    proteinGrams: 26.1,
    carbohydratesGrams: 28.1,
    fatGrams: 36.2,
    fiberGrams: 12.2,
    sugarGrams: 6.8,
    sodiumMilligrams: 13,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 120
  },
  'turmeric powder': {
    name: 'Turmeric Powder (Haldi)',
    calories: 312,
    proteinGrams: 9.7,
    carbohydratesGrams: 67.1,
    fatGrams: 3.3,
    fiberGrams: 22.7,
    sugarGrams: 3.2,
    sodiumMilligrams: 38,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 100
  },
  'red chilli powder': {
    name: 'Red Chilli Powder',
    calories: 318,
    proteinGrams: 12.0,
    carbohydratesGrams: 56.6,
    fatGrams: 17.3,
    fiberGrams: 27.2,
    sugarGrams: 10.3,
    sodiumMilligrams: 30,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 95
  },
  'salt': {
    name: 'Table Salt (Sodium Chloride)',
    calories: 0,
    proteinGrams: 0.0,
    carbohydratesGrams: 0.0,
    fatGrams: 0.0,
    fiberGrams: 0.0,
    sugarGrams: 0.0,
    sodiumMilligrams: 38758,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 292
  },
  'sugar': {
    name: 'Granulated Sugar',
    calories: 387,
    proteinGrams: 0.0,
    carbohydratesGrams: 100.0,
    fatGrams: 0.0,
    fiberGrams: 0.0,
    sugarGrams: 100.0,
    sodiumMilligrams: 1,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 200
  },

  // Animal Proteins
  'egg': {
    name: 'Whole Chicken Egg',
    calories: 143,
    proteinGrams: 12.6,
    carbohydratesGrams: 0.7,
    fatGrams: 9.5,
    fiberGrams: 0.0,
    sugarGrams: 0.4,
    sodiumMilligrams: 142,
    defaultPieceWeightGrams: 50, // 1 large egg
    cupWeightGrams: 243
  },
  'chicken breast': {
    name: 'Skinless Boneless Chicken Breast (Raw)',
    calories: 120,
    proteinGrams: 22.5,
    carbohydratesGrams: 0.0,
    fatGrams: 2.6,
    fiberGrams: 0.0,
    sugarGrams: 0.0,
    sodiumMilligrams: 65,
    defaultPieceWeightGrams: 200,
    cupWeightGrams: 140
  },
  'fish': {
    name: 'White Fish Fillet (Rohu / Tilapia / Pomfret)',
    calories: 96,
    proteinGrams: 20.1,
    carbohydratesGrams: 0.0,
    fatGrams: 1.7,
    fiberGrams: 0.0,
    sugarGrams: 0.0,
    sodiumMilligrams: 56,
    defaultPieceWeightGrams: 150,
    cupWeightGrams: 150
  },
  'mutton': {
    name: 'Lean Mutton / Goat Meat',
    calories: 143,
    proteinGrams: 20.6,
    carbohydratesGrams: 0.0,
    fatGrams: 6.2,
    fiberGrams: 0.0,
    sugarGrams: 0.0,
    sodiumMilligrams: 82,
    defaultPieceWeightGrams: null,
    cupWeightGrams: 160
  },

  // Fruits & Extras
  'lemon': {
    name: 'Lemon Juice / Whole Lemon',
    calories: 29,
    proteinGrams: 1.1,
    carbohydratesGrams: 9.3,
    fatGrams: 0.3,
    fiberGrams: 2.8,
    sugarGrams: 2.5,
    sodiumMilligrams: 2,
    defaultPieceWeightGrams: 50,
    cupWeightGrams: 240
  },
  'banana': {
    name: 'Banana (Ripe)',
    calories: 89,
    proteinGrams: 1.1,
    carbohydratesGrams: 22.8,
    fatGrams: 0.3,
    fiberGrams: 2.6,
    sugarGrams: 12.2,
    sodiumMilligrams: 1,
    defaultPieceWeightGrams: 118,
    cupWeightGrams: 150
  },
  'apple': {
    name: 'Apple (With Skin)',
    calories: 52,
    proteinGrams: 0.3,
    carbohydratesGrams: 13.8,
    fatGrams: 0.2,
    fiberGrams: 2.4,
    sugarGrams: 10.4,
    sodiumMilligrams: 1,
    defaultPieceWeightGrams: 182,
    cupWeightGrams: 125
  }
};

/**
 * Common Alias mappings to canonical ingredient names
 */
export const INGREDIENT_ALIASES = {
  // Grains
  'basmati rice': 'rice',
  'white rice': 'rice',
  'raw rice': 'rice',
  'cooked rice': 'rice',
  'chawal': 'rice',
  'atta': 'wheat flour',
  'whole wheat flour': 'wheat flour',
  'flour': 'wheat flour',
  'gehu ka atta': 'wheat flour',
  'rava': 'suji',
  'semolina': 'suji',
  'sooji': 'suji',
  'chivda': 'poha',
  'beaten rice': 'poha',

  // Pulses
  'arhar dal': 'toor dal',
  'tur dal': 'toor dal',
  'pigeon pea': 'toor dal',
  'yellow moong dal': 'moong dal',
  'mung dal': 'moong dal',
  'green gram': 'moong dal',
  'bengal gram': 'chana dal',
  'black gram': 'urad dal',
  'kabuli chana': 'chickpeas',
  'chana': 'chickpeas',
  'white chickpeas': 'chickpeas',
  'chole': 'chickpeas',
  'rajma': 'kidney beans',
  'red beans': 'kidney beans',

  // Dairy
  'cottage cheese': 'paneer',
  'fresh paneer': 'paneer',
  'dahi': 'curd',
  'yogurt': 'curd',
  'plain yogurt': 'curd',
  'greek yogurt': 'curd',
  'desi ghee': 'ghee',
  'clarified butter': 'ghee',
  'milk full cream': 'milk',
  'cow milk': 'milk',
  'whole milk': 'milk',

  // Veggies
  'potatoes': 'potato',
  'aloo': 'potato',
  'batata': 'potato',
  'onions': 'onion',
  'pyaz': 'onion',
  'kanda': 'onion',
  'tomatoes': 'tomato',
  'tamatar': 'tomato',
  'peas': 'green peas',
  'matar': 'green peas',
  'carrots': 'carrot',
  'gajar': 'carrot',
  'palak': 'spinach',
  'spinach leaves': 'spinach',
  'gobi': 'cauliflower',
  'patta gobi': 'cabbage',
  'shimla mirch': 'capsicum',
  'bell pepper': 'capsicum',
  'green bell pepper': 'capsicum',
  'lehsun': 'garlic',
  'garlic cloves': 'garlic',
  'adrak': 'ginger',
  'ginger root': 'ginger',
  'hari mirch': 'green chilies',
  'green chili': 'green chilies',
  'green chilli': 'green chilies',
  'green chillies': 'green chilies',
  'cilantro': 'coriander leaves',
  'dhania': 'coriander leaves',
  'coriander': 'coriander leaves',
  'basil': 'fresh basil',
  'tulsi': 'fresh basil',

  // Oils
  'oil': 'cooking oil',
  'refined oil': 'cooking oil',
  'sunflower oil': 'cooking oil',
  'mustard oil': 'cooking oil',
  'vegetable oil': 'cooking oil',

  // Spices
  'jeera': 'cumin seeds',
  'cumin': 'cumin seeds',
  'rai': 'mustard seeds',
  'haldi': 'turmeric powder',
  'turmeric': 'turmeric powder',
  'lal mirch': 'red chilli powder',
  'chilli powder': 'red chilli powder',
  'chili powder': 'red chilli powder',
  'salt to taste': 'salt',
  'iodized salt': 'salt',

  // Proteins
  'eggs': 'egg',
  'chicken': 'chicken breast',
  'boneless chicken': 'chicken breast',
  'chicken pieces': 'chicken breast',
  'fish fillet': 'fish',
  'goat meat': 'mutton',
  'lamb': 'mutton',

  // Fruits
  'nimbu': 'lemon',
  'lime': 'lemon',
  'kela': 'banana',
  'seb': 'apple'
};

/**
 * Standard generic unit conversions to grams
 */
export const GENERIC_UNIT_TO_GRAMS = {
  // Mass
  'g': 1,
  'gram': 1,
  'grams': 1,
  'kg': 1000,
  'kilogram': 1000,
  'kilograms': 1000,
  'mg': 0.001,
  'milligram': 0.001,
  'milligrams': 0.001,

  // Volume (Assuming water-equivalent 1g/ml density unless overridden)
  'ml': 1,
  'milliliter': 1,
  'milliliters': 1,
  'l': 1000,
  'liter': 1000,
  'liters': 1000,
  'tsp': 5,
  'teaspoon': 5,
  'teaspoons': 5,
  'tbsp': 15,
  'tablespoon': 15,
  'tablespoons': 15,
  'cup': 200,
  'cups': 200,

  // Small culinary measures
  'pinch': 0.5,
  'pinches': 0.5,
  'dash': 1,
  'clove': 3,
  'cloves': 3,
  'leaf': 0.5,
  'leaves': 0.5,
  'stalk': 10,
  'stalks': 10,
  'slice': 25,
  'slices': 25
};
