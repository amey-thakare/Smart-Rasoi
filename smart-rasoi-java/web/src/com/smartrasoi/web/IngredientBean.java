package com.smartrasoi.web;

import java.io.Serializable;

/**
 * Unit 7 Syllabus Topic: JavaBeans Specification.
 *
 * Demonstrates:
 * - Implements java.io.Serializable
 * - Public zero-argument (default) constructor
 * - Private properties
 * - Public getter and setter methods following standard JavaBean naming conventions
 * - Used in JSP with <jsp:useBean>, <jsp:setProperty>, and <jsp:getProperty>
 */
public class IngredientBean implements Serializable {

    private static final long serialVersionUID = 1L;

    private String id;
    private String name;
    private String category;
    private double quantity;
    private String unit;
    private double unitPrice;
    private String expiryDate;
    private String location;

    // 1. Zero-argument constructor
    public IngredientBean() {
        this.id = "";
        this.name = "";
        this.category = "GRAIN";
        this.quantity = 0.0;
        this.unit = "kg";
        this.unitPrice = 0.0;
        this.expiryDate = "";
        this.location = "Pantry";
    }

    // 2. Convenience constructor
    public IngredientBean(String id, String name, String category, double quantity,
                          String unit, double unitPrice, String expiryDate, String location) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.quantity = quantity;
        this.unit = unit;
        this.unitPrice = unitPrice;
        this.expiryDate = expiryDate;
        this.location = location;
    }

    // Computed property accessible in JSP EL as ${item.stockValue}
    public double getStockValue() {
        return this.quantity * this.unitPrice;
    }

    // 3. Standard Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public double getQuantity() { return quantity; }
    public void setQuantity(double quantity) { this.quantity = quantity; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(double unitPrice) { this.unitPrice = unitPrice; }

    public String getExpiryDate() { return expiryDate; }
    public void setExpiryDate(String expiryDate) { this.expiryDate = expiryDate; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
}
