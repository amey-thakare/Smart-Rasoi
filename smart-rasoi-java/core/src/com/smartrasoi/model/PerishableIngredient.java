package com.smartrasoi.model;

import com.smartrasoi.util.SmartRasoiEntity;
import java.time.LocalDate;

/**
 * Unit 2 Syllabus Topic: Multilevel Inheritance and 'super' Keyword.
 *
 * Demonstrates:
 * - Multilevel inheritance: KitchenItem (base) -> Ingredient (derived) -> PerishableIngredient (further derived)
 * - Using super(...) constructor invocation with augmented parameters
 * - Using super.method() to extend superclass logic
 * - Specialized polymorphic behavior for short shelf-life items (e.g. Milk, Paneer, Spinach)
 */
@SmartRasoiEntity(tableName = "perishable_ingredients", description = "High-spoilage ingredient with refrigeration constraints")
public class PerishableIngredient extends Ingredient {

    private static final long serialVersionUID = 1L;

    private double maxSafeTemperatureCelsius;
    private boolean isOpened;
    private int daysAfterOpeningShelfLife;

    public PerishableIngredient(String name, Category category, double quantity, String unit,
                                double unitPrice, LocalDate expiryDate, double maxSafeTemperatureCelsius) {
        super(null, name, category, quantity, unit, 0.5, unitPrice, expiryDate, "Fridge");
        this.maxSafeTemperatureCelsius = maxSafeTemperatureCelsius;
        this.isOpened = false;
        this.daysAfterOpeningShelfLife = 3;
    }

    public PerishableIngredient(String id, String name, Category category, double quantity, String unit,
                                double minThreshold, double unitPrice, LocalDate expiryDate, String location,
                                double maxSafeTemperatureCelsius, boolean isOpened, int daysAfterOpeningShelfLife) {
        // Invoking superclass constructor
        super(id, name, category, quantity, unit, minThreshold, unitPrice, expiryDate, location);
        this.maxSafeTemperatureCelsius = maxSafeTemperatureCelsius;
        this.isOpened = isOpened;
        this.daysAfterOpeningShelfLife = Math.max(1, daysAfterOpeningShelfLife);
    }

    @Override
    public String getStorageRequirement() {
        // Invoking superclass implementation and augmenting it
        String baseStorage = super.getStorageRequirement();
        return String.format("%s | STRICT: Maintain temperature below %.1f°C. Spoilage risk is HIGH.",
                baseStorage, maxSafeTemperatureCelsius);
    }

    public void markAsOpened() {
        this.isOpened = true;
        // When opened, expiry accelerates to today + daysAfterOpeningShelfLife
        LocalDate acceleratedExpiry = LocalDate.now().plusDays(daysAfterOpeningShelfLife);
        if (getExpiryDate() == null || acceleratedExpiry.isBefore(getExpiryDate())) {
            setExpiryDate(acceleratedExpiry);
        }
    }

    public double getMaxSafeTemperatureCelsius() {
        return maxSafeTemperatureCelsius;
    }

    public void setMaxSafeTemperatureCelsius(double maxSafeTemperatureCelsius) {
        this.maxSafeTemperatureCelsius = maxSafeTemperatureCelsius;
    }

    public boolean isOpened() {
        return isOpened;
    }

    public void setOpened(boolean opened) {
        isOpened = opened;
    }

    public int getDaysAfterOpeningShelfLife() {
        return daysAfterOpeningShelfLife;
    }

    public void setDaysAfterOpeningShelfLife(int daysAfterOpeningShelfLife) {
        this.daysAfterOpeningShelfLife = daysAfterOpeningShelfLife;
    }

    @Override
    public String toString() {
        return String.format("PerishableIngredient [%s, maxTemp=%.1f°C, opened=%s, exp=%s]",
                getName(), maxSafeTemperatureCelsius, isOpened, getExpiryDate());
    }
}
