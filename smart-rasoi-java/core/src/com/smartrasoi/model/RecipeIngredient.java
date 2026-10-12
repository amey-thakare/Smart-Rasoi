package com.smartrasoi.model;

import java.io.Serializable;

/**
 * Unit 2 Syllabus Topic: Object Composition & Domain Association.
 *
 * Represents an ingredient requirement within a recipe specification,
 * including required quantity, measurement unit, and whether optional.
 */
public class RecipeIngredient implements Serializable {

    private static final long serialVersionUID = 1L;

    private String name;
    private double amount;
    private String unit;
    private boolean isOptional;
    private String notes;

    public RecipeIngredient() {
        this("", 0.0, "unit", false, "");
    }

    public RecipeIngredient(String name, double amount, String unit) {
        this(name, amount, unit, false, "");
    }

    public RecipeIngredient(String name, double amount, String unit, boolean isOptional) {
        this(name, amount, unit, isOptional, "");
    }

    public RecipeIngredient(String name, double amount, String unit, boolean isOptional, String notes) {
        this.name = (name != null) ? name.trim() : "";
        this.amount = Math.max(0.0, amount);
        this.unit = (unit != null) ? unit.trim().toLowerCase() : "unit";
        this.isOptional = isOptional;
        this.notes = (notes != null) ? notes.trim() : "";
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = (name != null) ? name.trim() : "";
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = Math.max(0.0, amount);
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = (unit != null) ? unit.trim().toLowerCase() : "unit";
    }

    public boolean isOptional() {
        return isOptional;
    }

    public void setOptional(boolean optional) {
        isOptional = optional;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    @Override
    public String toString() {
        return String.format("%.2f %s %s%s", amount, unit, name, (isOptional ? " (Optional)" : ""));
    }
}
