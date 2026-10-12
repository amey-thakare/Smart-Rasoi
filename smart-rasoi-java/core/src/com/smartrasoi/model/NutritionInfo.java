package com.smartrasoi.model;

import java.io.Serializable;

/**
 * Unit 1 & 2 Syllabus Topic: Primitive Data Types, Arrays & Mathematical Expressions.
 *
 * Demonstrates:
 * - Primitive numerical types (double, int)
 * - Array operations including multidimensional arrays (weekly nutrient matrix)
 * - Calculation of macronutrient caloric contribution using operator precedence:
 *   Calories = (protein * 4) + (carbs * 4) + (fat * 9)
 */
public class NutritionInfo implements Serializable {

    private static final long serialVersionUID = 1L;

    private double calories; // kcal
    private double protein;  // grams
    private double carbs;    // grams
    private double fat;      // grams
    private double fiber;    // grams

    public NutritionInfo() {
        this(0.0, 0.0, 0.0, 0.0, 0.0);
    }

    public NutritionInfo(double calories, double protein, double carbs, double fat, double fiber) {
        this.calories = Math.max(0.0, calories);
        this.protein = Math.max(0.0, protein);
        this.carbs = Math.max(0.0, carbs);
        this.fat = Math.max(0.0, fat);
        this.fiber = Math.max(0.0, fiber);
    }

    /**
     * Demonstrates: Operators, Precedence, and Type Casting.
     * Computes estimated calories using the 4-4-9 Atwater macronutrient factors.
     */
    public double computeEstimatedCaloriesFromMacros() {
        // Operator precedence: multiplications (*) take precedence over additions (+)
        double rawCal = (this.protein * 4.0) + (this.carbs * 4.0) + (this.fat * 9.0);
        // Explicit type casting demonstration (Unit 1: Type casting double to int then back)
        int roundedCal = (int) Math.round(rawCal);
        return (double) roundedCal;
    }

    /**
     * Demonstrates Unit 1: Multidimensional arrays and nested loops.
     * Processes a 7x3 weekly meal nutrition matrix (7 days, 3 meals: breakfast, lunch, dinner)
     * and calculates weekly aggregated totals.
     *
     * @param weeklyCalorieMatrix 2D array [7][3] containing calorie values
     * @return 1D array of length 7 containing total daily calories
     */
    public static double[] calculateDailyCalorieTotals(double[][] weeklyCalorieMatrix) {
        if (weeklyCalorieMatrix == null || weeklyCalorieMatrix.length == 0) {
            return new double[0];
        }

        // 1D array creation (Unit 1)
        double[] dailyTotals = new double[weeklyCalorieMatrix.length];

        // Nested for loops (Unit 1)
        for (int day = 0; day < weeklyCalorieMatrix.length; day++) {
            double sumForDay = 0.0;
            if (weeklyCalorieMatrix[day] != null) {
                // Enhanced for loop (Unit 1)
                for (double mealCalories : weeklyCalorieMatrix[day]) {
                    sumForDay += mealCalories;
                }
            }
            dailyTotals[day] = sumForDay;
        }

        return dailyTotals;
    }

    public double getCalories() { return calories; }
    public void setCalories(double calories) { this.calories = Math.max(0.0, calories); }

    public double getProtein() { return protein; }
    public void setProtein(double protein) { this.protein = Math.max(0.0, protein); }

    public double getCarbs() { return carbs; }
    public void setCarbs(double carbs) { this.carbs = Math.max(0.0, carbs); }

    public double getFat() { return fat; }
    public void setFat(double fat) { this.fat = Math.max(0.0, fat); }

    public double getFiber() { return fiber; }
    public void setFiber(double fiber) { this.fiber = Math.max(0.0, fiber); }

    @Override
    public String toString() {
        return String.format("Nutrition [Calories: %.1f kcal | Protein: %.1fg | Carbs: %.1fg | Fat: %.1fg | Fiber: %.1fg]",
                calories, protein, carbs, fat, fiber);
    }
}
