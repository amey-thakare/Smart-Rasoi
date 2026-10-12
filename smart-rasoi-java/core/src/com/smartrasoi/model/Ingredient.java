package com.smartrasoi.model;

import com.smartrasoi.exception.InvalidQuantityException;
import com.smartrasoi.util.CostCalculable;
import com.smartrasoi.util.SmartRasoiEntity;
import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

/**
 * Unit 2 Syllabus Topic: Inheritance, Polymorphism, Method Overriding/Overloading,
 * Nested Classes, and Interfaces.
 *
 * Demonstrates:
 * - Subclassing an abstract class (KitchenItem)
 * - Implementing multiple interfaces (CostCalculable, Comparable, Serializable)
 * - Constructor overloading & 'super' keyword to call parent constructors
 * - Method overloading (multiple addStock signatures)
 * - Method overriding (polymorphic implementation of abstract methods)
 * - Static nested class (Ingredient.Builder)
 * - Member inner class (Ingredient.StockSnapshot)
 */
@SmartRasoiEntity(tableName = "ingredients", description = "Inventory ingredient with quantity and expiry tracking")
public class Ingredient extends KitchenItem implements CostCalculable, Comparable<Ingredient>, Serializable {

    private static final long serialVersionUID = 1L;

    // Encapsulated fields specific to pantry ingredients
    private double quantity;
    private String unit; // kg, g, l, ml, piece, packet
    private double minThreshold; // Low stock trigger
    private LocalDate expiryDate;
    private String location; // Pantry, Fridge, Freezer

    /**
     * Default constructor - chains via this(...) to overloaded constructor
     */
    public Ingredient() {
        this("ITEM-" + System.currentTimeMillis(), "Unnamed Ingredient", Category.GRAIN, 0.0, "kg", 1.0, 0.0, null, "Pantry");
    }

    /**
     * Overloaded constructor 1 - basic initialization
     */
    public Ingredient(String name, double quantity, String unit, Category category) {
        this(null, name, category, quantity, unit, 1.0, 0.0, null, "Pantry");
    }

    /**
     * Overloaded constructor 2 - with unit price and low threshold
     */
    public Ingredient(String name, Category category, double quantity, String unit, double unitPrice, double minThreshold) {
        this(null, name, category, quantity, unit, minThreshold, unitPrice, null, "Pantry");
    }

    /**
     * Overloaded constructor 3 - comprehensive initialization using 'super'
     */
    public Ingredient(String id, String name, Category category, double quantity, String unit,
                      double minThreshold, double unitPrice, LocalDate expiryDate, String location) {
        // Invoking superclass constructor (Unit 2: super keyword)
        super(id, name, category, unitPrice);
        this.quantity = Math.max(0.0, quantity);
        this.unit = (unit != null && !unit.trim().isEmpty()) ? unit.trim().toLowerCase() : "unit";
        this.minThreshold = Math.max(0.0, minThreshold);
        this.expiryDate = expiryDate;
        this.location = (location != null) ? location.trim() : "Pantry";
    }

    // ==========================================
    // POLYMORPHISM & METHOD OVERRIDING (Unit 2)
    // ==========================================

    @Override
    public String getStorageRequirement() {
        if ("Freezer".equalsIgnoreCase(location)) {
            return "Keep frozen at -18°C in airtight container";
        } else if ("Fridge".equalsIgnoreCase(location) || category == Category.DAIRY || category == Category.VEGETABLE) {
            return "Refrigerate at 2-5°C, away from direct sunlight";
        }
        return "Store in a cool, dry pantry inside an airtight jar";
    }

    @Override
    public double calculateStockValue() {
        return this.quantity * this.unitPrice;
    }

    // Interface CostCalculable implementation
    @Override
    public double calculateTotalCost() {
        return calculateStockValue();
    }

    // ==========================================
    // METHOD OVERLOADING (Unit 2)
    // ==========================================

    /**
     * Overloaded method 1: simple quantity increment
     */
    public void addStock(double amount) throws InvalidQuantityException {
        if (amount <= 0.0) {
            throw new InvalidQuantityException("Cannot add non-positive quantity to stock: " + amount, amount);
        }
        this.quantity += amount;
    }

    /**
     * Overloaded method 2: quantity increment with audit reason
     */
    public void addStock(double amount, String reason) throws InvalidQuantityException {
        addStock(amount); // delegates to overloaded sibling
        // reason logged in audit trail
    }

    /**
     * Overloaded method 3: quantity increment with unit price update (weighted average pricing)
     */
    public void addStock(double amount, double newBatchUnitPrice) throws InvalidQuantityException {
        if (amount <= 0.0) {
            throw new InvalidQuantityException("Cannot add non-positive quantity: " + amount, amount);
        }
        if (newBatchUnitPrice < 0.0) {
            throw new InvalidQuantityException("Unit price cannot be negative: " + newBatchUnitPrice, newBatchUnitPrice);
        }
        double currentTotalVal = this.quantity * this.unitPrice;
        double newBatchTotalVal = amount * newBatchUnitPrice;
        this.quantity += amount;
        this.unitPrice = (this.quantity > 0) ? (currentTotalVal + newBatchTotalVal) / this.quantity : newBatchUnitPrice;
    }

    /**
     * Deducts stock with domain validation
     */
    public void deductStock(double amount) throws InvalidQuantityException {
        if (amount <= 0.0) {
            throw new InvalidQuantityException("Deduction quantity must be strictly positive: " + amount, amount);
        }
        if (amount > this.quantity) {
            throw new InvalidQuantityException("Deduction amount " + amount + " exceeds current quantity " + this.quantity, amount);
        }
        this.quantity -= amount;
    }

    public boolean isLowStock() {
        return this.quantity <= this.minThreshold;
    }

    public boolean isExpired() {
        if (expiryDate == null) {
            return false;
        }
        return expiryDate.isBefore(LocalDate.now());
    }

    public boolean isExpiringWithin(int days) {
        if (expiryDate == null) {
            return false;
        }
        LocalDate threshold = LocalDate.now().plusDays(days);
        return !isExpired() && (expiryDate.isEqual(threshold) || expiryDate.isBefore(threshold));
    }

    // Comparable<Ingredient> implementation - Natural ordering by ingredient name (Unit 4)
    @Override
    public int compareTo(Ingredient other) {
        if (other == null) return 1;
        return this.name.compareToIgnoreCase(other.name);
    }

    // ==========================================
    // NESTED CLASSES (Unit 2)
    // ==========================================

    /**
     * Member Inner Class: represents a point-in-time snapshot of the enclosing Ingredient instance.
     * Inner class can access private instance members of the outer class directly.
     */
    public class StockSnapshot {
        private final double recordedQuantity;
        private final LocalDate snapshotDate;

        public StockSnapshot() {
            // Directly accesses outer class private instance field 'quantity'
            this.recordedQuantity = Ingredient.this.quantity;
            this.snapshotDate = LocalDate.now();
        }

        public double getRecordedQuantity() {
            return recordedQuantity;
        }

        public LocalDate getSnapshotDate() {
            return snapshotDate;
        }

        public String getIngredientName() {
            return Ingredient.this.name;
        }
    }

    /**
     * Static Nested Class: Builder pattern for Ingredient creation.
     * Does not require an instance of the outer class to be instantiated.
     */
    public static class Builder {
        private String id;
        private String name;
        private Category category = Category.GRAIN;
        private double quantity = 0.0;
        private String unit = "kg";
        private double minThreshold = 1.0;
        private double unitPrice = 0.0;
        private LocalDate expiryDate;
        private String location = "Pantry";

        public Builder id(String id) { this.id = id; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder category(Category category) { this.category = category; return this; }
        public Builder quantity(double quantity) { this.quantity = quantity; return this; }
        public Builder unit(String unit) { this.unit = unit; return this; }
        public Builder minThreshold(double minThreshold) { this.minThreshold = minThreshold; return this; }
        public Builder unitPrice(double unitPrice) { this.unitPrice = unitPrice; return this; }
        public Builder expiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; return this; }
        public Builder location(String location) { this.location = location; return this; }

        public Ingredient build() {
            return new Ingredient(id, name, category, quantity, unit, minThreshold, unitPrice, expiryDate, location);
        }
    }

    // Getters and Setters
    public double getQuantity() { return quantity; }
    public void setQuantity(double quantity) { this.quantity = Math.max(0.0, quantity); }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = (unit != null) ? unit.trim().toLowerCase() : "unit"; }

    public double getMinThreshold() { return minThreshold; }
    public void setMinThreshold(double minThreshold) { this.minThreshold = Math.max(0.0, minThreshold); }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = (location != null) ? location.trim() : "Pantry"; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Ingredient)) return false;
        Ingredient that = (Ingredient) o;
        return Objects.equals(name.toLowerCase(), that.name.toLowerCase());
    }

    @Override
    public int hashCode() {
        return Objects.hash(name.toLowerCase());
    }

    @Override
    public String toString() {
        return String.format("Ingredient [name=%s, qty=%.2f %s, cat=%s, price=₹%.2f, exp=%s]",
                name, quantity, unit, category, unitPrice, (expiryDate != null ? expiryDate.toString() : "N/A"));
    }
}
