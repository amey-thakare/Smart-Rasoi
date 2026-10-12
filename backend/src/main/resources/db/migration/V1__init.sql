CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

CREATE TABLE inventory_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    quantity DOUBLE PRECISION NOT NULL,
    unit VARCHAR(50) NOT NULL,
    purchase_date DATE,
    expiry_date DATE,
    unit_cost DOUBLE PRECISION,
    storage_location VARCHAR(100),
    notes TEXT,
    consumed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE recipes (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    cuisine VARCHAR(100),
    meal_category VARCHAR(100),
    prep_time_minutes INTEGER,
    cook_time_minutes INTEGER,
    servings INTEGER,
    difficulty VARCHAR(50),
    estimated_cost DOUBLE PRECISION,
    calories DOUBLE PRECISION,
    protein DOUBLE PRECISION,
    carbohydrates DOUBLE PRECISION,
    fat DOUBLE PRECISION,
    fiber DOUBLE PRECISION,
    instructions TEXT
);

CREATE TABLE recipe_dietary_tags (
    recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    dietary_tags VARCHAR(100)
);

CREATE TABLE recipe_allergens (
    recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    allergens VARCHAR(100)
);
