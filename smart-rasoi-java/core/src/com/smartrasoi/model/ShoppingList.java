package com.smartrasoi.model;

import com.smartrasoi.util.CostCalculable;
import com.smartrasoi.util.SmartRasoiEntity;
import java.io.Serializable;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Unit 2 & 4 Syllabus Topic: Aggregation, CostCalculable Interface, and Stream Operations.
 *
 * Encapsulates a grocery shopping list with budget enforcement, item collection,
 * and cost tracking.
 */
@SmartRasoiEntity(tableName = "shopping_lists", description = "Grocery shopping list with budget controls")
public class ShoppingList implements CostCalculable, Serializable {

    private static final long serialVersionUID = 1L;

    public enum ListStatus { ACTIVE, COMPLETED, ARCHIVED }

    private String id;
    private String userId;
    private String name;
    private double budget;
    private ListStatus status;
    private LocalDate createdAt;
    private List<ShoppingListItem> items;

    public ShoppingList() {
        this(null, null, "Weekly Grocery Run", 2000.0);
    }

    public ShoppingList(String id, String userId, String name, double budget) {
        this.id = id;
        this.userId = userId;
        this.name = (name != null) ? name.trim() : "Weekly Grocery Run";
        this.budget = Math.max(0.0, budget);
        this.status = ListStatus.ACTIVE;
        this.createdAt = LocalDate.now();
        this.items = new ArrayList<>();
    }

    public void addItem(ShoppingListItem item) {
        if (item != null) {
            this.items.add(item);
        }
    }

    public void removeItemById(String itemId) {
        if (itemId != null) {
            this.items.removeIf(item -> itemId.equals(item.getId()));
        }
    }

    /**
     * Interface CostCalculable implementation: calculates sum of estimated or actual item costs.
     */
    @Override
    public double calculateTotalCost() {
        double total = 0.0;
        // Enhanced for loop (Unit 1)
        for (ShoppingListItem item : items) {
            total += item.calculateTotalCost();
        }
        return total;
    }

    public double calculateTotalActualSpent() {
        return items.stream()
                .filter(ShoppingListItem::isPurchased)
                .mapToDouble(ShoppingListItem::getActualPrice)
                .sum();
    }

    public double calculateRemainingBudget() {
        return Math.max(0.0, this.budget - calculateTotalCost());
    }

    public boolean isOverBudget() {
        return isCostExceeded(this.budget); // Uses default method from CostCalculable interface!
    }

    public int getPurchasedItemCount() {
        return (int) items.stream().filter(ShoppingListItem::isPurchased).count();
    }

    public int getTotalItemCount() {
        return items.size();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = (name != null) ? name.trim() : ""; }

    public double getBudget() { return budget; }
    public void setBudget(double budget) { this.budget = Math.max(0.0, budget); }

    public ListStatus getStatus() { return status; }
    public void setStatus(ListStatus status) { this.status = status; }

    public LocalDate getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDate createdAt) { this.createdAt = createdAt; }

    public List<ShoppingListItem> getItems() { return Collections.unmodifiableList(items); }
    public void setItems(List<ShoppingListItem> items) {
        this.items = (items != null) ? new ArrayList<>(items) : new ArrayList<>();
    }

    @Override
    public String toString() {
        return String.format("ShoppingList [%s, Budget: ₹%.2f, Est Cost: ₹%.2f, Items: %d/%d purchased]",
                name, budget, calculateTotalCost(), getPurchasedItemCount(), getTotalItemCount());
    }
}
