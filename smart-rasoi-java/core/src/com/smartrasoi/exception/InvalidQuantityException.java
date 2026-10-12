package com.smartrasoi.exception;

/**
 * Unit 3 Syllabus Topic: User-Defined Checked Exception.
 *
 * Thrown when an inventory quantity, recipe ingredient amount, or purchase volume
 * violates business constraints (e.g., negative or zero values where positive is required).
 */
public class InvalidQuantityException extends KitchenException {

    private static final long serialVersionUID = 1L;
    private final double attemptedQuantity;

    public InvalidQuantityException(String message, double attemptedQuantity) {
        super(message, "ERR_INVALID_QUANTITY");
        this.attemptedQuantity = attemptedQuantity;
    }

    public double getAttemptedQuantity() {
        return attemptedQuantity;
    }
}
