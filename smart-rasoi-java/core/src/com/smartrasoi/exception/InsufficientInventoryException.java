package com.smartrasoi.exception;

/**
 * Unit 3 Syllabus Topic: User-Defined Checked Exception.
 *
 * Thrown when a recipe meal cooking deduction or recipe shortfall calculation
 * attempts to consume more ingredient quantity than currently available in pantry stock.
 */
public class InsufficientInventoryException extends KitchenException {

    private static final long serialVersionUID = 1L;
    private final String ingredientName;
    private final double requiredQuantity;
    private final double availableQuantity;

    public InsufficientInventoryException(String ingredientName, double requiredQuantity, double availableQuantity) {
        super(String.format("Insufficient inventory for '%s'. Required: %.2f, Available in pantry: %.2f",
                ingredientName, requiredQuantity, availableQuantity), "ERR_INSUFFICIENT_INVENTORY");
        this.ingredientName = ingredientName;
        this.requiredQuantity = requiredQuantity;
        this.availableQuantity = availableQuantity;
    }

    public String getIngredientName() {
        return ingredientName;
    }

    public double getRequiredQuantity() {
        return requiredQuantity;
    }

    public double getAvailableQuantity() {
        return availableQuantity;
    }

    public double getShortfall() {
        return Math.max(0.0, requiredQuantity - availableQuantity);
    }
}
