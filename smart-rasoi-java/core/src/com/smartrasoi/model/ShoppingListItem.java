package com.smartrasoi.model;

import com.smartrasoi.util.CostCalculable;
import java.io.Serializable;

/**
 * Unit 2 Syllabus Topic: Domain Modeling & Encapsulation.
 *
 * Represents an individual grocery item within a Smart Rasoi shopping list,
 * tracking quantity needed, estimated price, actual purchase price, and purchase state.
 */
public class ShoppingListItem implements CostCalculable, Serializable {

    private static final long serialVersionUID = 1L;

    private String id;
    private String name;
    private Category category;
    private double quantity;
    private String unit;
    private double estimatedPrice;
    private double actualPrice;
    private boolean isPurchased;
    private boolean isAddedToInventory;

    public ShoppingListItem() {
        this(null, "Grocery Item", Category.GRAIN, 1.0, "unit", 0.0);
    }

    public ShoppingListItem(String id, String name, Category category, double quantity, String unit, double estimatedPrice) {
        this.id = id;
        this.name = (name != null) ? name.trim() : "Grocery Item";
        this.category = (category != null) ? category : Category.GRAIN;
        this.quantity = Math.max(0.0, quantity);
        this.unit = (unit != null) ? unit.trim().toLowerCase() : "unit";
        this.estimatedPrice = Math.max(0.0, estimatedPrice);
        this.actualPrice = 0.0;
        this.isPurchased = false;
        this.isAddedToInventory = false;
    }

    public void markPurchased(double actualPrice) {
        this.isPurchased = true;
        this.actualPrice = Math.max(0.0, actualPrice);
    }

    public void markUnpurchased() {
        this.isPurchased = false;
        this.actualPrice = 0.0;
        this.isAddedToInventory = false;
    }

    @Override
    public double calculateTotalCost() {
        // If purchased, cost is actual price; otherwise use estimated price
        return isPurchased ? actualPrice : estimatedPrice;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = (name != null) ? name.trim() : ""; }

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

    public double getQuantity() { return quantity; }
    public void setQuantity(double quantity) { this.quantity = Math.max(0.0, quantity); }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public double getEstimatedPrice() { return estimatedPrice; }
    public void setEstimatedPrice(double estimatedPrice) { this.estimatedPrice = Math.max(0.0, estimatedPrice); }

    public double getActualPrice() { return actualPrice; }
    public void setActualPrice(double actualPrice) { this.actualPrice = Math.max(0.0, actualPrice); }

    public boolean isPurchased() { return isPurchased; }
    public void setPurchased(boolean purchased) { isPurchased = purchased; }

    public boolean isAddedToInventory() { return isAddedToInventory; }
    public void setAddedToInventory(boolean addedToInventory) { isAddedToInventory = addedToInventory; }

    @Override
    public String toString() {
        return String.format("[%s] %.2f %s %s - Est: ₹%.2f, Act: ₹%.2f",
                (isPurchased ? "PURCHASED" : "PENDING"), quantity, unit, name, estimatedPrice, actualPrice);
    }
}
