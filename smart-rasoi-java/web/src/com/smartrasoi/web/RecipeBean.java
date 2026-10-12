package com.smartrasoi.web;

import java.io.Serializable;

/**
 * Unit 7 Syllabus Topic: JavaBeans Specification.
 *
 * Demonstrates:
 * - Serializable JavaBean representing recipes in JSP views
 * - No-arg constructor and encapsulated bean properties
 */
public class RecipeBean implements Serializable {

    private static final long serialVersionUID = 1L;

    private String id;
    private String title;
    private String cuisine;
    private String difficulty;
    private int totalTimeMinutes;
    private int servings;

    public RecipeBean() {
        this.id = "";
        this.title = "";
        this.cuisine = "Indian";
        this.difficulty = "Easy";
        this.totalTimeMinutes = 30;
        this.servings = 2;
    }

    public RecipeBean(String id, String title, String cuisine, String difficulty, int totalTimeMinutes, int servings) {
        this.id = id;
        this.title = title;
        this.cuisine = cuisine;
        this.difficulty = difficulty;
        this.totalTimeMinutes = totalTimeMinutes;
        this.servings = servings;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCuisine() { return cuisine; }
    public void setCuisine(String cuisine) { this.cuisine = cuisine; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public int getTotalTimeMinutes() { return totalTimeMinutes; }
    public void setTotalTimeMinutes(int totalTimeMinutes) { this.totalTimeMinutes = totalTimeMinutes; }

    public int getServings() { return servings; }
    public void setServings(int servings) { this.servings = servings; }
}
