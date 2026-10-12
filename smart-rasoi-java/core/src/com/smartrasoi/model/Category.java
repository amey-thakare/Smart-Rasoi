package com.smartrasoi.model;

/**
 * Unit 1 & 2 Syllabus Topic: Constants, Java Tokens & Enumeration.
 *
 * Demonstrates:
 * - Enum type definition in Java
 * - Constant values with associated metadata
 * - Constructor and getter within enum
 * - Static lookup methods
 */
public enum Category {
    GRAIN("Grains & Cereals", 365),
    VEGETABLE("Fresh Vegetables", 7),
    DAIRY("Dairy & Milk Products", 5),
    SPICE("Spices & Condiments", 180),
    PULSE("Pulses & Lentils", 365),
    OIL("Cooking Oils & Fats", 180),
    SNACK("Snacks & Bakery", 14),
    BEVERAGE("Tea, Coffee & Beverages", 90);

    private final String displayName;
    private final int typicalShelfLifeDays;

    Category(String displayName, int typicalShelfLifeDays) {
        this.displayName = displayName;
        this.typicalShelfLifeDays = typicalShelfLifeDays;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getTypicalShelfLifeDays() {
        return typicalShelfLifeDays;
    }

    /**
     * Case-insensitive lookup helper.
     * @param value category name
     * @return matching Category or GRAIN as fallback
     */
    public static Category fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return GRAIN;
        }
        for (Category c : values()) {
            if (c.name().equalsIgnoreCase(value.trim()) || c.displayName.equalsIgnoreCase(value.trim())) {
                return c;
            }
        }
        return GRAIN;
    }
}
