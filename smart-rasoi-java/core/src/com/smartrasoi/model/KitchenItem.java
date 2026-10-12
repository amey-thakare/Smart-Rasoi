package com.smartrasoi.model;

import com.smartrasoi.util.SmartRasoiEntity;
import java.io.Serializable;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Unit 2 Syllabus Topic: Abstract Classes, Encapsulation, Static Blocks & Polymorphism.
 *
 * Demonstrates:
 * - Abstract class with abstract and concrete methods
 * - Static initialization block (runs once when class is loaded into JVM)
 * - Constructor overloading & 'this' reference for constructor chaining
 * - Encapsulation with private/protected instance variables
 * - Static member variables
 * - Legacy finalize() explicitly labeled as deprecated for university syllabus demonstration
 */
@SmartRasoiEntity(tableName = "kitchen_items", description = "Base abstract representation of kitchen inventory items")
public abstract class KitchenItem implements Serializable {

    private static final long serialVersionUID = 1L;

    // Static member tracking total instances created (JVM class-level state)
    private static final AtomicInteger INSTANCE_COUNTER = new AtomicInteger(0);

    // Static initialization block (Unit 2 concept)
    static {
        // Executed once when KitchenItem class is loaded into JVM memory by ClassLoader
        // Demonstrates class-level initialization before any object instantiation
    }

    // Encapsulated state (protected so subclasses can access directly)
    protected String id;
    protected String name;
    protected Category category;
    protected double unitPrice; // Cost per unit in Rupees

    /**
     * Default constructor - demonstrates constructor chaining using this(...)
     */
    public KitchenItem() {
        this("ITEM-" + INSTANCE_COUNTER.incrementAndGet(), "Unnamed Item", Category.GRAIN, 0.0);
    }

    /**
     * Overloaded constructor 1 - partial parameters
     */
    public KitchenItem(String name, Category category) {
        this("ITEM-" + INSTANCE_COUNTER.incrementAndGet(), name, category, 0.0);
    }

    /**
     * Overloaded constructor 2 - full parameters (primary constructor)
     */
    public KitchenItem(String id, String name, Category category, double unitPrice) {
        this.id = (id != null && !id.trim().isEmpty()) ? id : "ITEM-" + INSTANCE_COUNTER.incrementAndGet();
        this.name = (name != null) ? name.trim() : "Unnamed Item";
        this.category = (category != null) ? category : Category.GRAIN;
        this.unitPrice = Math.max(0.0, unitPrice);
    }

    // Abstract methods: Forces concrete subclasses to provide polymorphic implementation
    /**
     * Polymorphic method: Subclasses specify how this item must be stored.
     * @return storage instructions string
     */
    public abstract String getStorageRequirement();

    /**
     * Polymorphic method: Subclasses compute total valuation based on their specific quantity logic.
     * @return current value in inventory
     */
    public abstract double calculateStockValue();

    // Concrete methods shared by all subclasses
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = (name != null) ? name.trim() : "";
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public double getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(double unitPrice) {
        this.unitPrice = Math.max(0.0, unitPrice);
    }

    public static int getTotalItemsInstantiated() {
        return INSTANCE_COUNTER.get();
    }

    /**
     * Unit 2 Syllabus Topic: Object lifecycle and garbage collection concept.
     *
     * IMPORTANT: Deprecated in Java 9+ (JEP 214) and fundamentally discouraged in modern Java.
     * Retained strictly for academic syllabus demonstration.
     * Resource cleanup in production must always use try-with-resources or AutoCloseable.
     */
    @Override
    @Deprecated
    @SuppressWarnings("removal")
    protected void finalize() throws Throwable {
        try {
            // Academic demonstration: prints notification when garbage collector reclaims unreferenced object
            // System.out.println("[GC-Demo] Garbage Collector called finalize() on KitchenItem: " + name);
        } finally {
            super.finalize();
        }
    }

    @Override
    public String toString() {
        return String.format("%s [id=%s, name=%s, category=%s, unitPrice=%.2f]",
                getClass().getSimpleName(), id, name, category, unitPrice);
    }
}
