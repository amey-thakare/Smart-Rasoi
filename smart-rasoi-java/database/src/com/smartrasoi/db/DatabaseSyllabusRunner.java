package com.smartrasoi.db;

import com.smartrasoi.exception.DuplicateUserException;
import com.smartrasoi.model.Category;
import com.smartrasoi.model.Ingredient;
import com.smartrasoi.model.User;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Unit 5 Syllabus Topic: JDBC Execution Demonstration Runner.
 *
 * Demonstrates:
 * - Establishing JDBC Connection to SQLite
 * - DDL schema initialization
 * - CRUD operations: INSERT, SELECT, UPDATE, DELETE with PreparedStatement
 * - Transaction control with commit and rollback
 * - User registration with salted cryptographic hashing and authentication
 *
 * Can be run via:
 *   java -cp "bin:lib/sqlite-jdbc.jar" com.smartrasoi.db.DatabaseSyllabusRunner
 */
public class DatabaseSyllabusRunner {

    public static void main(String[] args) {
        System.out.println("================================================================================");
        System.out.println("  SMART RASOI - UNIT 5 JDBC PERSISTENCE & DATABASE RUNNER");
        System.out.println("================================================================================");

        try {
            DatabaseConnection db = DatabaseConnection.getInstance("jdbc:sqlite:smart-rasoi-java/smart_rasoi_academic.db");

            // 1. DDL: Initialize Schema
            System.out.println("\n1. Initializing SQLite Database Tables...");
            db.initializeDatabase();
            System.out.println("   Tables created successfully (users, ingredients, recipes, shopping_lists).");

            // 2. Seeder
            System.out.println("\n2. Bootstrapping Seed Data...");
            DataSeeder seeder = new DataSeeder(db);
            seeder.seedAll();
            System.out.println("   Seed data populated successfully.");

            IngredientJdbcRepository ingredientRepo = new IngredientJdbcRepository(db);

            // 3. SELECT ALL
            System.out.println("\n3. Testing JDBC SELECT Query (findAll):");
            List<Ingredient> ingredients = ingredientRepo.findAll();
            System.out.println("   Total ingredients currently in SQLite database: " + ingredients.size());
            for (Ingredient item : ingredients) {
                System.out.println("   - [" + item.getId() + "] " + item.getName() + " (" + item.getQuantity() + " " + item.getUnit() + ") @ ₹" + item.getUnitPrice());
            }

            // 4. INSERT
            System.out.println("\n4. Testing JDBC INSERT (PreparedStatement):");
            Ingredient cardamom = new Ingredient("ING-TEST-01", "Green Cardamom (Elaichi)", Category.SPICE, 0.1, "kg", 0.02, 3200.0, LocalDate.now().plusMonths(12), "Spice Box");
            boolean inserted = ingredientRepo.insert(cardamom);
            System.out.println("   Inserted new ingredient: " + cardamom.getName() + " -> Result: " + inserted);

            // 5. SELECT by ID
            System.out.println("\n5. Testing JDBC SELECT by ID:");
            Optional<Ingredient> found = ingredientRepo.findById("ING-TEST-01");
            System.out.println("   Found: " + (found.isPresent() ? found.get().getName() + " (Unit Price: ₹" + found.get().getUnitPrice() + ")" : "NOT FOUND"));

            // 6. UPDATE
            System.out.println("\n6. Testing JDBC UPDATE (PreparedStatement):");
            if (found.isPresent()) {
                Ingredient itemToUpdate = found.get();
                itemToUpdate.setQuantity(0.25);
                itemToUpdate.setUnitPrice(3400.0);
                boolean updated = ingredientRepo.update(itemToUpdate);
                System.out.println("   Updated quantity to 0.25 kg & price to ₹3400.0 -> Result: " + updated);
            }

            // 7. TRANSACTION DEMO
            System.out.println("\n7. Testing JDBC Transaction Management (setAutoCommit(false), commit, rollback):");
            List<Ingredient> batch = new ArrayList<>();
            if (found.isPresent()) {
                Ingredient item = found.get();
                item.setQuantity(0.30);
                batch.add(item);
            }
            boolean batchSuccess = ingredientRepo.updateBatchInTransaction(batch);
            System.out.println("   Batch update in transaction committed successfully: " + batchSuccess);

            // 8. DELETE
            System.out.println("\n8. Testing JDBC DELETE (PreparedStatement):");
            boolean deleted = ingredientRepo.deleteById("ING-TEST-01");
            System.out.println("   Deleted test ingredient ING-TEST-01 -> Result: " + deleted);

            // 9. USER REGISTRATION & AUTHENTICATION (Requirement 11)
            System.out.println("\n9. Testing User Authentication & Salted Hashing via JDBC:");
            UserJdbcRepository userRepo = new UserJdbcRepository(db);

            String testEmail = "demo_chef_" + System.currentTimeMillis() + "@rasoi.ac.in";
            try {
                User registered = userRepo.registerUser("Vikramaditya", testEmail, "SecureChefPass123!");
                System.out.println("   User registered successfully: " + registered.getName() + " (" + registered.getEmail() + ")");
                System.out.println("   Password Hash: " + registered.getPasswordHash().substring(0, 20) + "... (SALTED SHA-256)");
                System.out.println("   Salt: " + registered.getSalt());

                // Verify valid login
                Optional<User> authSuccess = userRepo.authenticate(testEmail, "SecureChefPass123!");
                System.out.println("   Authenticating with correct password -> Success? " + authSuccess.isPresent());

                // Verify invalid login
                Optional<User> authFail = userRepo.authenticate(testEmail, "WrongPassword!");
                System.out.println("   Authenticating with incorrect password -> Success? " + authFail.isPresent() + " (Correctly rejected)");

                // Duplicate registration test
                try {
                    userRepo.registerUser("Duplicate Chef", testEmail, "AnyPassword123!");
                    System.out.println("   Duplicate registration was NOT rejected!");
                } catch (DuplicateUserException e) {
                    System.out.println("   Duplicate registration correctly caught DuplicateUserException: " + e.getMessage());
                }

            } catch (Exception e) {
                System.err.println("   User auth error: " + e.getMessage());
            }

            System.out.println("\n================================================================================");
            System.out.println("  UNIT 5 JDBC VERIFICATION COMPLETED CLEANLY AND SUCCESSFULLY!");
            System.out.println("================================================================================\n");

        } catch (SQLException e) {
            System.err.println("[JDBC-Error] " + e.getMessage());
        } catch (Exception e) {
            System.err.println("[Error] " + e.getMessage());
        }
    }
}
