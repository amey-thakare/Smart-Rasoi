package com.smartrasoi.model;

import com.smartrasoi.util.SmartRasoiEntity;
import java.io.Serializable;
import java.time.LocalDate;

/**
 * Unit 2 Syllabus Topic: Domain Modeling and State Transitions.
 *
 * Represents a scheduled meal entry linking a Recipe, calendar date, meal type,
 * and completion status.
 */
@SmartRasoiEntity(tableName = "meal_plans", description = "Scheduled calendar meal plan entry")
public class MealPlan implements Serializable {

    private static final long serialVersionUID = 1L;

    public enum MealType { BREAKFAST, LUNCH, DINNER, SNACK }
    public enum MealStatus { PLANNED, COOKED, SKIPPED }

    private String id;
    private String userId;
    private Recipe recipe;
    private LocalDate planDate;
    private MealType mealType;
    private MealStatus status;
    private int servings;
    private String notes;

    public MealPlan() {
        this(null, null, null, LocalDate.now(), MealType.LUNCH, 2);
    }

    public MealPlan(String id, String userId, Recipe recipe, LocalDate planDate, MealType mealType, int servings) {
        this.id = id;
        this.userId = userId;
        this.recipe = recipe;
        this.planDate = (planDate != null) ? planDate : LocalDate.now();
        this.mealType = (mealType != null) ? mealType : MealType.LUNCH;
        this.status = MealStatus.PLANNED;
        this.servings = Math.max(1, servings);
        this.notes = "";
    }

    public void markCooked() {
        this.status = MealStatus.COOKED;
    }

    public void markSkipped() {
        this.status = MealStatus.SKIPPED;
    }

    public boolean isPending() {
        return this.status == MealStatus.PLANNED;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Recipe getRecipe() { return recipe; }
    public void setRecipe(Recipe recipe) { this.recipe = recipe; }

    public LocalDate getPlanDate() { return planDate; }
    public void setPlanDate(LocalDate planDate) { this.planDate = planDate; }

    public MealType getMealType() { return mealType; }
    public void setMealType(MealType mealType) { this.mealType = mealType; }

    public MealStatus getStatus() { return status; }
    public void setStatus(MealStatus status) { this.status = status; }

    public int getServings() { return servings; }
    public void setServings(int servings) { this.servings = Math.max(1, servings); }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    @Override
    public String toString() {
        String recipeName = (recipe != null) ? recipe.getTitle() : "Unassigned Meal";
        return String.format("MealPlan [%s | %s | %s | %s (%d servings)]",
                planDate, mealType, status, recipeName, servings);
    }
}
