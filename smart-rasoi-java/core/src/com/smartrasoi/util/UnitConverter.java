package com.smartrasoi.util;

/**
 * Unit 1 Syllabus Topic: Operators, Expressions, Precedence, Type Casting & Switch Statements.
 *
 * Demonstrates:
 * - Symbolic constants (public static final)
 * - Widening (implicit) and Narrowing (explicit) type casting
 * - Arithmetic expressions and precedence
 * - Switch-case statement on Strings
 * - Indian and metric culinary measurement conversions (kg <-> g, l <-> ml, tsp <-> tbsp)
 */
public final class UnitConverter {

    // Symbolic constants (Unit 1)
    public static final double GRAMS_PER_KG = 1000.0;
    public static final double ML_PER_LITER = 1000.0;
    public static final double ML_PER_TBSP = 15.0;
    public static final double ML_PER_TSP = 5.0;
    public static final double GRAMS_PER_CUP = 240.0;

    // Private constructor prevents instantiation of utility class
    private UnitConverter() {}

    /**
     * Converts a quantity from one unit to another compatible unit.
     * Demonstrates switch statement and expressions.
     */
    public static double convert(double quantity, String fromUnit, String toUnit) {
        if (fromUnit == null || toUnit == null || fromUnit.equalsIgnoreCase(toUnit)) {
            return quantity;
        }

        String from = fromUnit.trim().toLowerCase();
        String to = toUnit.trim().toLowerCase();

        // Mass conversions
        if (from.equals("kg") && to.equals("g")) {
            return quantity * GRAMS_PER_KG;
        } else if (from.equals("g") && to.equals("kg")) {
            return quantity / GRAMS_PER_KG;
        }

        // Volume conversions
        if (from.equals("l") && to.equals("ml")) {
            return quantity * ML_PER_LITER;
        } else if (from.equals("ml") && to.equals("l")) {
            return quantity / ML_PER_LITER;
        }

        // Spoon to ml
        if (from.equals("tbsp") && to.equals("ml")) {
            return quantity * ML_PER_TBSP;
        } else if (from.equals("tsp") && to.equals("ml")) {
            return quantity * ML_PER_TSP;
        }

        // Default: incompatible or unsupported unit conversion returns original quantity
        return quantity;
    }

    /**
     * Demonstrates Unit 1: Widening and Narrowing Type Casting.
     *
     * Widening: int -> long -> float -> double (automatic/implicit)
     * Narrowing: double -> float -> long -> int (requires explicit cast (type))
     */
    public static int convertQuantityToPantryGramsRounded(double quantityKg) {
        // Widening: integer literal multiplied with double results in double calculation
        double gramsExact = quantityKg * GRAMS_PER_KG;

        // Narrowing: explicit cast from double (64-bit float) to int (32-bit signed integer)
        // High-precision fractional data is truncated
        int gramsRounded = (int) Math.round(gramsExact);

        return gramsRounded;
    }

    /**
     * Normalizes ingredient amount into standard base units ('g' for mass, 'ml' for liquids).
     */
    public static double toBaseStandard(double amount, String unit) {
        if (unit == null) return amount;
        switch (unit.toLowerCase().trim()) {
            case "kg":
                return amount * GRAMS_PER_KG;
            case "g":
                return amount;
            case "l":
                return amount * ML_PER_LITER;
            case "ml":
                return amount;
            case "tbsp":
                return amount * ML_PER_TBSP;
            case "tsp":
                return amount * ML_PER_TSP;
            case "cup":
                return amount * GRAMS_PER_CUP;
            default:
                return amount;
        }
    }
}
