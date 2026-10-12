package com.smartrasoi.service;

import com.smartrasoi.exception.InsufficientInventoryException;
import com.smartrasoi.exception.InvalidQuantityException;
import com.smartrasoi.model.Category;
import com.smartrasoi.model.Ingredient;
import com.smartrasoi.util.UnitConverter;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Unit 4 Syllabus Topic: Collections Framework, Iterators, Comparators & Lambdas.
 *
 * Demonstrates:
 * - Map<String, Ingredient> for high-performance O(1) keyed lookups
 * - List<Ingredient> for sequential operations
 * - Set<String> for extracting distinct ingredient names
 * - Explicit java.util.Iterator usage (hasNext, next, remove)
 * - Custom Comparator implementations (by name, quantity, expiry, price)
 * - Lambda expressions with Streams API (filter, map, collect)
 * - Exception throwing (InvalidQuantityException, InsufficientInventoryException)
 */
public class InventoryService {

    // In-memory collections
    private final Map<String, Ingredient> inventoryMap; // Key: item ID

    public InventoryService() {
        this.inventoryMap = new LinkedHashMap<>();
    }

    public void addIngredient(Ingredient ingredient) {
        if (ingredient != null && ingredient.getId() != null) {
            inventoryMap.put(ingredient.getId(), ingredient);
        }
    }

    public Optional<Ingredient> findById(String id) {
        return Optional.ofNullable(inventoryMap.get(id));
    }

    /**
     * Map lookup: case-insensitive search by ingredient name.
     */
    public Optional<Ingredient> findByName(String name) {
        if (name == null) return Optional.empty();
        String clean = name.trim().toLowerCase();
        for (Ingredient item : inventoryMap.values()) {
            if (item.getName().equalsIgnoreCase(clean)) {
                return Optional.of(item);
            }
        }
        return Optional.empty();
    }

    public List<Ingredient> getAllIngredients() {
        return new ArrayList<>(inventoryMap.values());
    }

    /**
     * Unit 4 Concept: Using a Set to extract distinct, unique ingredient names.
     */
    public Set<String> getUniqueIngredientNames() {
        Set<String> uniqueNames = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        for (Ingredient item : inventoryMap.values()) {
            uniqueNames.add(item.getName());
        }
        return uniqueNames;
    }

    /**
     * Deducts stock for a recipe cooking operation.
     * Demonstrates custom checked exception InsufficientInventoryException.
     */
    public void deductStockForCooking(String ingredientName, double requiredAmount, String requiredUnit)
            throws InsufficientInventoryException, InvalidQuantityException {
        if (requiredAmount <= 0) {
            throw new InvalidQuantityException("Required amount must be positive: " + requiredAmount, requiredAmount);
        }

        Ingredient pantryItem = findByName(ingredientName)
                .orElseThrow(() -> new InsufficientInventoryException(ingredientName, requiredAmount, 0.0));

        // Convert required amount to pantry item unit
        double convertedRequired = UnitConverter.convert(requiredAmount, requiredUnit, pantryItem.getUnit());

        if (pantryItem.getQuantity() < convertedRequired) {
            throw new InsufficientInventoryException(ingredientName, convertedRequired, pantryItem.getQuantity());
        }

        pantryItem.deductStock(convertedRequired);
    }

    /**
     * Unit 4 Concept: Explicit Iterator usage.
     * Demonstrates using Iterator.remove() to safely eliminate expired ingredients during traversal.
     */
    public List<Ingredient> purgeExpiredIngredients() {
        List<Ingredient> purgedList = new ArrayList<>();
        Iterator<Map.Entry<String, Ingredient>> iterator = inventoryMap.entrySet().iterator();

        while (iterator.hasNext()) {
            Map.Entry<String, Ingredient> entry = iterator.next();
            Ingredient item = entry.getValue();

            if (item.isExpired()) {
                purgedList.add(item);
                // Safe removal during iteration without ConcurrentModificationException
                iterator.remove();
            }
        }

        return purgedList;
    }

    // ==========================================
    // COMPARATORS AND SORTING (Unit 4)
    // ==========================================

    /**
     * Sorts ingredients by Name ascending using natural order or custom Comparator.
     */
    public List<Ingredient> getIngredientsSortedByName() {
        List<Ingredient> list = getAllIngredients();
        // Uses Ingredient's compareTo implementation
        Collections.sort(list);
        return list;
    }

    /**
     * Sorts ingredients by Quantity descending using custom Comparator.
     */
    public List<Ingredient> getIngredientsSortedByQuantityDesc() {
        List<Ingredient> list = getAllIngredients();
        list.sort(new Comparator<Ingredient>() {
            @Override
            public int compare(Ingredient i1, Ingredient i2) {
                return Double.compare(i2.getQuantity(), i1.getQuantity());
            }
        });
        return list;
    }

    /**
     * Sorts ingredients by Expiry Date ascending (earliest expiring first) using Lambda Comparator.
     */
    public List<Ingredient> getIngredientsSortedByExpiry() {
        List<Ingredient> list = getAllIngredients();
        // Java 8 Lambda expression Comparator
        list.sort((i1, i2) -> {
            if (i1.getExpiryDate() == null && i2.getExpiryDate() == null) return 0;
            if (i1.getExpiryDate() == null) return 1;
            if (i2.getExpiryDate() == null) return -1;
            return i1.getExpiryDate().compareTo(i2.getExpiryDate());
        });
        return list;
    }

    // ==========================================
    // LAMBDA EXPRESSIONS & STREAMS (Unit 4)
    // ==========================================

    /**
     * Filters low stock items using Lambda predicate.
     */
    public List<Ingredient> getLowStockIngredients() {
        return inventoryMap.values().stream()
                .filter(Ingredient::isLowStock)
                .collect(Collectors.toList());
    }

    /**
     * Filters items expiring within given days using Lambda expression.
     */
    public List<Ingredient> getExpiringSoonIngredients(int days) {
        return inventoryMap.values().stream()
                .filter(item -> item.isExpiringWithin(days))
                .collect(Collectors.toList());
    }

    /**
     * Calculates total inventory valuation using Stream reduce/sum.
     */
    public double calculateTotalInventoryValue() {
        return inventoryMap.values().stream()
                .mapToDouble(Ingredient::calculateStockValue)
                .sum();
    }
}
