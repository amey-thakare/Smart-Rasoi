package com.smartrasoi.util;

/**
 * Unit 2 Syllabus Topic: Interfaces.
 *
 * Demonstrates:
 * - Interface declaration and public abstract methods
 * - Symbolic constants (public static final by default)
 * - Java 8 default method with default behavior
 * - Java 8 static method within interface
 */
public interface CostCalculable {

    // Symbolic constant (implicitly public static final)
    double DEFAULT_TAX_RATE = 0.05; // 5% GST/Tax on groceries
    String CURRENCY_SYMBOL = "₹";

    /**
     * Calculates total monetary cost of this kitchen item or collection.
     * @return total cost in currency units
     */
    double calculateTotalCost();

    /**
     * Java 8 Default Method: allows providing default implementation in interfaces.
     * Subclasses can override if custom logic is required.
     *
     * @param budget maximum allowed cost
     * @return true if cost exceeds specified budget
     */
    default boolean isCostExceeded(double budget) {
        return calculateTotalCost() > budget;
    }

    /**
     * Java 8 Static Method: utility function scoped to interface namespace.
     *
     * @param amount numeric currency value
     * @return formatted string with currency symbol
     */
    static String formatCurrency(double amount) {
        return String.format("%s%.2f", CURRENCY_SYMBOL, amount);
    }
}
