package com.smartrasoi.service;

import com.smartrasoi.model.*;
import com.smartrasoi.util.UnitConverter;
import java.util.*;

/**
 * Unit 4 Syllabus Topic: Sets for Deduplication, Maps for Aggregation, and Shopping Optimization.
 *
 * Demonstrates:
 * - Compiling shopping lists from recipe shortfall requirements
 * - Using Set<String> and Map<String, ShoppingListItem> to deduplicate and aggregate
 *   quantities across multiple meal recipes
 * - Grocery budget optimization and purchase-to-inventory conversion
 */
public class ShoppingService {

    private final List<ShoppingList> shoppingLists;

    public ShoppingService() {
        this.shoppingLists = new ArrayList<>();
    }

    public void addShoppingList(ShoppingList list) {
        if (list != null) {
            shoppingLists.add(list);
        }
    }

    public List<ShoppingList> getAllShoppingLists() {
        return Collections.unmodifiableList(shoppingLists);
    }

    public Optional<ShoppingList> findById(String id) {
        if (id == null) return Optional.empty();
        return shoppingLists.stream()
                .filter(l -> id.equals(l.getId()))
                .findFirst();
    }

    /**
     * Generates a smart consolidated shopping list from a list of planned meals,
     * deducting available pantry stock so only true shortfalls are added.
     *
     * Demonstrates:
     * - Map aggregation for combining identical ingredients across recipes
     * - Set for tracking distinct items
     */
    public ShoppingList generateListFromMealPlans(String listName, double budget,
                                                  List<MealPlan> mealPlans, InventoryService inventoryService) {
        ShoppingList generatedList = new ShoppingList("SL-" + System.currentTimeMillis(), "user-1", listName, budget);

        // Map: Key = ingredientName (lowercase), Value = ShoppingListItem
        Map<String, ShoppingListItem> aggregatedShortfalls = new LinkedHashMap<>();

        for (MealPlan plan : mealPlans) {
            if (plan.getRecipe() == null) continue;

            for (RecipeIngredient req : plan.getRecipe().getIngredients()) {
                String key = req.getName().toLowerCase().trim();
                double neededQty = req.getAmount() * ((double) plan.getServings() / Math.max(1, plan.getRecipe().getServings()));

                // Check pantry availability
                Optional<Ingredient> pantryItem = inventoryService.findByName(req.getName());
                double availableQty = 0.0;
                if (pantryItem.isPresent() && !pantryItem.get().isExpired()) {
                    availableQty = UnitConverter.convert(pantryItem.get().getQuantity(), pantryItem.get().getUnit(), req.getUnit());
                }

                double shortfall = Math.max(0.0, neededQty - availableQty);

                if (shortfall > 0.0) {
                    if (aggregatedShortfalls.containsKey(key)) {
                        ShoppingListItem existing = aggregatedShortfalls.get(key);
                        existing.setQuantity(existing.getQuantity() + shortfall);
                        // Approximate ₹50 per base unit
                        existing.setEstimatedPrice(existing.getQuantity() * 50.0);
                    } else {
                        ShoppingListItem newItem = new ShoppingListItem(
                                "ITEM-" + UUID.randomUUID().toString().substring(0, 8),
                                req.getName(),
                                Category.GRAIN,
                                shortfall,
                                req.getUnit(),
                                shortfall * 50.0
                        );
                        aggregatedShortfalls.put(key, newItem);
                    }
                }
            }
        }

        // Add all aggregated shortfalls to shopping list
        for (ShoppingListItem item : aggregatedShortfalls.values()) {
            generatedList.addItem(item);
        }

        shoppingLists.add(generatedList);
        return generatedList;
    }

    /**
     * Converts a purchased shopping list item into a kitchen pantry Ingredient.
     */
    public Ingredient convertPurchasedItemToPantry(ShoppingListItem item) {
        if (!item.isPurchased()) {
            throw new IllegalStateException("Item must be purchased before adding to inventory: " + item.getName());
        }
        item.setAddedToInventory(true);
        double unitPrice = (item.getQuantity() > 0) ? (item.getActualPrice() / item.getQuantity()) : 0.0;
        return new Ingredient(
                "ING-" + System.currentTimeMillis(),
                item.getName(),
                item.getCategory(),
                item.getQuantity(),
                item.getUnit(),
                1.0,
                unitPrice,
                null,
                "Pantry"
        );
    }
}
