package com.smartrasoi.service;

import com.smartrasoi.model.Ingredient;
import com.smartrasoi.model.Recipe;
import com.smartrasoi.model.RecipeIngredient;
import com.smartrasoi.util.UnitConverter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Unit 4 Syllabus Topic: Collections, Lambdas & Domain Matching Logic.
 *
 * Demonstrates:
 * - Recipe catalogue management
 * - Matching recipes against available pantry inventory
 * - Stream filtering by multiple criteria (prep time, difficulty, cuisine)
 * - Comparator chaining for recipe sorting
 */
public class RecipeService {

    private final List<Recipe> recipes;

    public RecipeService() {
        this.recipes = new ArrayList<>();
    }

    public void addRecipe(Recipe recipe) {
        if (recipe != null) {
            this.recipes.add(recipe);
        }
    }

    public List<Recipe> getAllRecipes() {
        return Collections.unmodifiableList(recipes);
    }

    public Optional<Recipe> findById(String id) {
        if (id == null) return Optional.empty();
        return recipes.stream()
                .filter(r -> id.equals(r.getId()))
                .findFirst();
    }

    /**
     * Inner class representing the matching result between a recipe and pantry inventory.
     */
    public static class RecipeMatchResult {
        private final Recipe recipe;
        private final boolean canCook;
        private final int matchedIngredientsCount;
        private final int totalRequiredIngredientsCount;
        private final List<RecipeIngredient> missingIngredients;

        public RecipeMatchResult(Recipe recipe, boolean canCook, int matched, int totalRequired, List<RecipeIngredient> missing) {
            this.recipe = recipe;
            this.canCook = canCook;
            this.matchedIngredientsCount = matched;
            this.totalRequiredIngredientsCount = totalRequired;
            this.missingIngredients = missing;
        }

        public Recipe getRecipe() { return recipe; }
        public boolean isCanCook() { return canCook; }
        public int getMatchedIngredientsCount() { return matchedIngredientsCount; }
        public int getTotalRequiredIngredientsCount() { return totalRequiredIngredientsCount; }
        public List<RecipeIngredient> getMissingIngredients() { return missingIngredients; }

        public double getMatchPercentage() {
            if (totalRequiredIngredientsCount == 0) return 100.0;
            return ((double) matchedIngredientsCount / totalRequiredIngredientsCount) * 100.0;
        }

        @Override
        public String toString() {
            return String.format("%s - canCook: %s (%.0f%% matched, %d missing)",
                    recipe.getTitle(), canCook, getMatchPercentage(), missingIngredients.size());
        }
    }

    /**
     * Evaluates recipe against an inventory service instance.
     */
    public RecipeMatchResult matchRecipe(Recipe recipe, InventoryService inventoryService) {
        List<RecipeIngredient> missing = new ArrayList<>();
        int matchedRequired = 0;
        int totalRequired = 0;

        for (RecipeIngredient req : recipe.getIngredients()) {
            if (!req.isOptional()) {
                totalRequired++;
            }

            Optional<Ingredient> pantryItem = inventoryService.findByName(req.getName());
            boolean satisfied = false;

            if (pantryItem.isPresent()) {
                Ingredient item = pantryItem.get();
                if (!item.isExpired()) {
                    double convertedRequired = UnitConverter.convert(req.getAmount(), req.getUnit(), item.getUnit());
                    if (item.getQuantity() >= convertedRequired) {
                        satisfied = true;
                    }
                }
            }

            if (satisfied) {
                if (!req.isOptional()) {
                    matchedRequired++;
                }
            } else {
                if (!req.isOptional()) {
                    missing.add(req);
                }
            }
        }

        boolean canCook = (missing.isEmpty());
        return new RecipeMatchResult(recipe, canCook, matchedRequired, totalRequired, missing);
    }

    /**
     * Finds all recipes that can be cooked right now with current pantry stock.
     */
    public List<RecipeMatchResult> findCookableRecipes(InventoryService inventoryService) {
        return recipes.stream()
                .map(recipe -> matchRecipe(recipe, inventoryService))
                .filter(RecipeMatchResult::isCanCook)
                .collect(Collectors.toList());
    }

    /**
     * Filters recipes by max total time using lambdas.
     */
    public List<Recipe> filterByMaxTime(int maxMinutes) {
        return recipes.stream()
                .filter(r -> r.getTotalTimeMinutes() <= maxMinutes)
                .sorted(Comparator.comparingInt(Recipe::getTotalTimeMinutes))
                .collect(Collectors.toList());
    }

    /**
     * Filters recipes by difficulty.
     */
    public List<Recipe> filterByDifficulty(String difficulty) {
        if (difficulty == null || difficulty.isEmpty()) return recipes;
        return recipes.stream()
                .filter(r -> r.getDifficulty().equalsIgnoreCase(difficulty))
                .collect(Collectors.toList());
    }
}
