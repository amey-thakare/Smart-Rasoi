INSERT INTO users (name, email, password, role) VALUES 
('Demo User', 'demo@smartrasoi.com', '$2a$10$WbK.8b9/lM5tQ3G1c9D2fOi0.wS9jD6l2Qh3I8T5y3mR1E1kQ1r62', 'USER'); -- password is 'password'

INSERT INTO recipes (owner_id, name, description, cuisine, meal_category, prep_time_minutes, cook_time_minutes, servings, difficulty, calories, protein, carbohydrates, fat, instructions) VALUES
(1, 'Paneer Tikka Masala', 'A classic vegetarian Indian dish.', 'Indian', 'Dinner', 20, 30, 4, 'Medium', 450, 15, 20, 30, '1. Marinate paneer. 2. Grill paneer. 3. Prepare gravy. 4. Mix and simmer.'),
(1, 'Quick Spinach Omelette', 'Healthy high-protein breakfast.', 'Global', 'Breakfast', 5, 5, 1, 'Easy', 250, 20, 5, 15, '1. Whisk eggs. 2. Add chopped spinach. 3. Cook on pan.');

INSERT INTO recipe_dietary_tags (recipe_id, dietary_tags) VALUES
(1, 'Vegetarian'),
(2, 'Vegetarian'), (2, 'Keto');

INSERT INTO inventory_items (user_id, name, category, quantity, unit, purchase_date, expiry_date, consumed) VALUES
(1, 'Paneer', 'Dairy', 500, 'g', CURRENT_DATE - 2, CURRENT_DATE + 3, false),
(1, 'Spinach', 'Vegetables', 200, 'g', CURRENT_DATE - 5, CURRENT_DATE + 1, false),
(1, 'Eggs', 'Dairy', 12, 'pieces', CURRENT_DATE - 1, CURRENT_DATE + 10, false),
(1, 'Milk', 'Dairy', 1, 'liter', CURRENT_DATE - 10, CURRENT_DATE - 1, false); -- expired
