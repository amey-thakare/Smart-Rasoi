package com.smartrasoi.db;

import com.smartrasoi.model.Category;
import com.smartrasoi.model.Ingredient;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Unit 5 Syllabus Topic: Sample Data Seeder & Database Bootstrapping.
 *
 * Populates initial pantry ingredients, recipes, and a demo student/faculty user
 * into the isolated SQLite database for the Java academic layer.
 */
public class DataSeeder {

    private final DatabaseConnection db;
    private final IngredientJdbcRepository ingredientRepo;
    private final UserJdbcRepository userRepo;

    public DataSeeder() {
        this.db = DatabaseConnection.getInstance();
        this.ingredientRepo = new IngredientJdbcRepository(db);
        this.userRepo = new UserJdbcRepository(db);
    }

    public DataSeeder(DatabaseConnection db) {
        this.db = db;
        this.ingredientRepo = new IngredientJdbcRepository(db);
        this.userRepo = new UserJdbcRepository(db);
    }

    public void seedAll() throws Exception {
        // 1. Initialize tables
        db.initializeDatabase();

        // 2. Seed default academic user
        seedDefaultUser();

        // 3. Seed default ingredients
        seedDefaultIngredients();

        // 4. Seed default recipes
        seedDefaultRecipes();
    }

    private void seedDefaultUser() throws Exception {
        try {
            if (!userRepo.findByEmail("student@smartrasoi.ac.in").isPresent()) {
                userRepo.registerUser("Academic Student", "student@smartrasoi.ac.in", "RasoiPass2026!");
                // System.out.println("[DataSeeder] Seeded default academic user: student@smartrasoi.ac.in");
            }
        } catch (Exception ignored) {}
    }

    private void seedDefaultIngredients() throws SQLException {
        List<Ingredient> existing = ingredientRepo.findAll();
        if (!existing.isEmpty()) {
            return; // Already seeded
        }

        List<Ingredient> defaultIngredients = new ArrayList<>();
        defaultIngredients.add(new Ingredient("ING-001", "Basmati Rice", Category.GRAIN, 5.0, "kg", 1.0, 95.0, LocalDate.now().plusMonths(6), "Pantry"));
        defaultIngredients.add(new Ingredient("ING-002", "Toor Dal", Category.PULSE, 2.0, "kg", 0.5, 140.0, LocalDate.now().plusMonths(8), "Pantry"));
        defaultIngredients.add(new Ingredient("ING-003", "Turmeric Powder (Haldi)", Category.SPICE, 0.25, "kg", 0.1, 320.0, LocalDate.now().plusMonths(12), "Spice Rack"));
        defaultIngredients.add(new Ingredient("ING-004", "Pure Cow Ghee", Category.DAIRY, 1.0, "l", 0.2, 650.0, LocalDate.now().plusMonths(4), "Pantry"));
        defaultIngredients.add(new Ingredient("ING-005", "Fresh Malai Paneer", Category.DAIRY, 0.4, "kg", 0.2, 360.0, LocalDate.now().plusDays(5), "Fridge"));
        defaultIngredients.add(new Ingredient("ING-006", "Onions", Category.VEGETABLE, 3.0, "kg", 1.0, 40.0, LocalDate.now().plusDays(10), "Pantry Basket"));
        defaultIngredients.add(new Ingredient("ING-007", "Tomatoes", Category.VEGETABLE, 2.0, "kg", 0.5, 35.0, LocalDate.now().plusDays(6), "Fridge"));
        defaultIngredients.add(new Ingredient("ING-008", "Cumin Seeds (Jeera)", Category.SPICE, 0.2, "kg", 0.05, 400.0, LocalDate.now().plusMonths(10), "Spice Rack"));
        defaultIngredients.add(new Ingredient("ING-009", "Mustard Oil", Category.OIL, 1.0, "l", 0.3, 160.0, LocalDate.now().plusMonths(9), "Pantry"));
        defaultIngredients.add(new Ingredient("ING-010", "Full Cream Milk", Category.DAIRY, 1.0, "l", 0.5, 66.0, LocalDate.now().plusDays(3), "Fridge"));

        for (Ingredient item : defaultIngredients) {
            ingredientRepo.insert(item);
        }
    }

    private void seedDefaultRecipes() throws SQLException {
        String countSql = "SELECT COUNT(*) FROM recipes";
        try (Connection conn = db.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(countSql);
             ResultSet rs = pstmt.executeQuery()) {
            if (rs.next() && rs.getInt(1) > 0) {
                return; // Recipes already seeded
            }
        }

        String insertRecipeSql = "INSERT INTO recipes (id, title, description, category, cuisine, difficulty, prep_time_minutes, cook_time_minutes, servings, instructions_json, is_shared) " +
                                 "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = db.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(insertRecipeSql)) {

            // Recipe 1: Dal Khichdi
            pstmt.setString(1, "REC-001");
            pstmt.setString(2, "Homestyle Moong Dal Khichdi");
            pstmt.setString(3, "Wholesome, comforting one-pot meal prepared with rice, moong dal, turmeric, and cumin tempering.");
            pstmt.setString(4, "GRAIN");
            pstmt.setString(5, "Indian");
            pstmt.setString(6, "Easy");
            pstmt.setInt(7, 10);
            pstmt.setInt(8, 20);
            pstmt.setInt(9, 2);
            pstmt.setString(10, "Wash rice and dal. Pressure cook with turmeric and salt. Temper with cumin seeds and ghee.");
            pstmt.setInt(11, 1);
            pstmt.executeUpdate();

            // Recipe 2: Paneer Bhurji
            pstmt.setString(1, "REC-002");
            pstmt.setString(2, "Amritsari Paneer Bhurji");
            pstmt.setString(3, "Scrambled paneer sautéed with finely chopped onions, tomatoes, green chillies, and fragrant spices.");
            pstmt.setString(4, "DAIRY");
            pstmt.setString(5, "North Indian");
            pstmt.setString(6, "Easy");
            pstmt.setInt(7, 10);
            pstmt.setInt(8, 15);
            pstmt.setInt(9, 3);
            pstmt.setString(10, "Sauté onions and tomatoes in ghee. Add turmeric and spices. Fold in crumbled paneer and simmer.");
            pstmt.setInt(11, 1);
            pstmt.executeUpdate();
        }
    }
}
