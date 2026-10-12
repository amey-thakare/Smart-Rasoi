package com.smartrasoi.model;

import com.smartrasoi.util.CostCalculable;
import com.smartrasoi.util.SmartRasoiEntity;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Unit 2 & 4 Syllabus Topic: Domain Modeling, Aggregation, Collections & Serialization.
 *
 * Demonstrates:
 * - Aggregation of RecipeIngredient objects in a List
 * - Implementing CostCalculable and Serializable
 * - Filtering and search methods
 */
@SmartRasoiEntity(tableName = "recipes", description = "Kitchen recipe definition with ingredients and cooking instructions")
public class Recipe implements CostCalculable, Serializable {

    private static final long serialVersionUID = 1L;

    private String id;
    private String title;
    private String description;
    private Category category;
    private String cuisine;
    private String difficulty; // Easy, Medium, Hard
    private int prepTimeMinutes;
    private int cookTimeMinutes;
    private int servings;
    private List<RecipeIngredient> ingredients;
    private List<String> instructions;
    private NutritionInfo nutrition;
    private boolean isShared;
    private String createdByUserId;

    public Recipe() {
        this(null, "Untitled Recipe", "", Category.GRAIN, "Indian", "Easy", 15, 20, 2);
    }

    public Recipe(String id, String title, String description, Category category,
                  String cuisine, String difficulty, int prepTimeMinutes, int cookTimeMinutes, int servings) {
        this.id = id;
        this.title = (title != null) ? title.trim() : "Untitled Recipe";
        this.description = (description != null) ? description.trim() : "";
        this.category = (category != null) ? category : Category.GRAIN;
        this.cuisine = (cuisine != null) ? cuisine.trim() : "Indian";
        this.difficulty = (difficulty != null) ? difficulty.trim() : "Easy";
        this.prepTimeMinutes = Math.max(0, prepTimeMinutes);
        this.cookTimeMinutes = Math.max(0, cookTimeMinutes);
        this.servings = Math.max(1, servings);
        this.ingredients = new ArrayList<>();
        this.instructions = new ArrayList<>();
        this.nutrition = new NutritionInfo();
        this.isShared = true;
    }

    public void addIngredient(RecipeIngredient ingredient) {
        if (ingredient != null) {
            this.ingredients.add(ingredient);
        }
    }

    public void addInstruction(String step) {
        if (step != null && !step.trim().isEmpty()) {
            this.instructions.add(step.trim());
        }
    }

    public int getTotalTimeMinutes() {
        return this.prepTimeMinutes + this.cookTimeMinutes;
    }

    // CostCalculable implementation - computes rough recipe baseline
    @Override
    public double calculateTotalCost() {
        // Approximates ₹15 base spice/overhead per serving + ₹20 base ingredient cost per serving
        return (double) servings * 35.0;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

    public String getCuisine() { return cuisine; }
    public void setCuisine(String cuisine) { this.cuisine = cuisine; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public int getPrepTimeMinutes() { return prepTimeMinutes; }
    public void setPrepTimeMinutes(int prepTimeMinutes) { this.prepTimeMinutes = prepTimeMinutes; }

    public int getCookTimeMinutes() { return cookTimeMinutes; }
    public void setCookTimeMinutes(int cookTimeMinutes) { this.cookTimeMinutes = cookTimeMinutes; }

    public int getServings() { return servings; }
    public void setServings(int servings) { this.servings = Math.max(1, servings); }

    public List<RecipeIngredient> getIngredients() { return Collections.unmodifiableList(ingredients); }
    public void setIngredients(List<RecipeIngredient> ingredients) {
        this.ingredients = (ingredients != null) ? new ArrayList<>(ingredients) : new ArrayList<>();
    }

    public List<String> getInstructions() { return Collections.unmodifiableList(instructions); }
    public void setInstructions(List<String> instructions) {
        this.instructions = (instructions != null) ? new ArrayList<>(instructions) : new ArrayList<>();
    }

    public NutritionInfo getNutrition() { return nutrition; }
    public void setNutrition(NutritionInfo nutrition) { this.nutrition = nutrition; }

    public boolean isShared() { return isShared; }
    public void setShared(boolean shared) { isShared = shared; }

    public String getCreatedByUserId() { return createdByUserId; }
    public void setCreatedByUserId(String createdByUserId) { this.createdByUserId = createdByUserId; }

    @Override
    public String toString() {
        return String.format("Recipe: %s (%s, %s, %d mins, %d servings)",
                title, cuisine, difficulty, getTotalTimeMinutes(), servings);
    }
}
