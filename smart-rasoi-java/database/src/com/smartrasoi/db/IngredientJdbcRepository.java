package com.smartrasoi.db;

import com.smartrasoi.model.Category;
import com.smartrasoi.model.Ingredient;
import java.sql.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Unit 5 Syllabus Topic: JDBC CRUD Operations, PreparedStatement, ResultSet & Transactions.
 *
 * Demonstrates:
 * - PreparedStatement for parameterized SQL queries (SQL injection prevention)
 * - ResultSet traversal and column mapping
 * - Full CRUD: INSERT, SELECT, UPDATE, DELETE
 * - Transaction management: setAutoCommit(false), commit(), and rollback() on failure
 * - Automatic resource management via try-with-resources
 */
public class IngredientJdbcRepository {

    private final DatabaseConnection db;

    public IngredientJdbcRepository() {
        this.db = DatabaseConnection.getInstance();
    }

    public IngredientJdbcRepository(DatabaseConnection db) {
        this.db = db;
    }

    /**
     * INSERT: Inserts a new ingredient record into the SQLite database.
     * Demonstrates PreparedStatement with parameterized values.
     */
    public boolean insert(Ingredient item) throws SQLException {
        String sql = "INSERT INTO ingredients (id, name, category, quantity, unit, min_threshold, unit_price, expiry_date, location) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = db.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, item.getId());
            pstmt.setString(2, item.getName());
            pstmt.setString(3, item.getCategory().name());
            pstmt.setDouble(4, item.getQuantity());
            pstmt.setString(5, item.getUnit());
            pstmt.setDouble(6, item.getMinThreshold());
            pstmt.setDouble(7, item.getUnitPrice());
            pstmt.setString(8, item.getExpiryDate() != null ? item.getExpiryDate().toString() : null);
            pstmt.setString(9, item.getLocation());

            int affectedRows = pstmt.executeUpdate();
            return affectedRows > 0;
        }
    }

    /**
     * SELECT by ID: Finds an ingredient by its primary key.
     * Demonstrates ResultSet column extraction.
     */
    public Optional<Ingredient> findById(String id) throws SQLException {
        String sql = "SELECT * FROM ingredients WHERE id = ?";

        try (Connection conn = db.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, id);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapResultSetToIngredient(rs));
                }
            }
        }
        return Optional.empty();
    }

    /**
     * SELECT ALL: Retrieves all pantry ingredients.
     */
    public List<Ingredient> findAll() throws SQLException {
        List<Ingredient> list = new ArrayList<>();
        String sql = "SELECT * FROM ingredients ORDER BY name ASC";

        try (Connection conn = db.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql);
             ResultSet rs = pstmt.executeQuery()) {

            while (rs.next()) {
                list.add(mapResultSetToIngredient(rs));
            }
        }
        return list;
    }

    /**
     * UPDATE: Modifies quantity and unit price of an existing ingredient.
     */
    public boolean update(Ingredient item) throws SQLException {
        String sql = "UPDATE ingredients SET name = ?, category = ?, quantity = ?, unit = ?, " +
                     "min_threshold = ?, unit_price = ?, expiry_date = ?, location = ? WHERE id = ?";

        try (Connection conn = db.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, item.getName());
            pstmt.setString(2, item.getCategory().name());
            pstmt.setDouble(3, item.getQuantity());
            pstmt.setString(4, item.getUnit());
            pstmt.setDouble(5, item.getMinThreshold());
            pstmt.setDouble(6, item.getUnitPrice());
            pstmt.setString(7, item.getExpiryDate() != null ? item.getExpiryDate().toString() : null);
            pstmt.setString(8, item.getLocation());
            pstmt.setString(9, item.getId());

            return pstmt.executeUpdate() > 0;
        }
    }

    /**
     * DELETE: Removes an ingredient record by primary key ID.
     */
    public boolean deleteById(String id) throws SQLException {
        String sql = "DELETE FROM ingredients WHERE id = ?";

        try (Connection conn = db.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, id);
            return pstmt.executeUpdate() > 0;
        }
    }

    /**
     * Unit 5 Topic: Database Transactions.
     * Demonstrates executing a batch of ingredient updates atomically.
     * If any update fails, the entire transaction is rolled back.
     *
     * @param items list of ingredients to update in one atomic batch
     * @return true if entire batch committed successfully
     */
    public boolean updateBatchInTransaction(List<Ingredient> items) throws SQLException {
        String sql = "UPDATE ingredients SET quantity = ?, unit_price = ? WHERE id = ?";

        Connection conn = null;
        try {
            conn = db.getConnection();
            // 1. Begin Transaction by disabling auto-commit
            conn.setAutoCommit(false);

            try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
                for (Ingredient item : items) {
                    pstmt.setDouble(1, item.getQuantity());
                    pstmt.setDouble(2, item.getUnitPrice());
                    pstmt.setString(3, item.getId());
                    pstmt.addBatch();
                }

                pstmt.executeBatch();
            }

            // 2. Commit transaction if all batch items succeeded
            conn.commit();
            return true;
        } catch (SQLException ex) {
            // 3. Rollback transaction on any failure
            if (conn != null) {
                try {
                    conn.rollback();
                    System.err.println("[Transaction] Rolled back batch updates due to: " + ex.getMessage());
                } catch (SQLException rollbackEx) {
                    rollbackEx.printStackTrace();
                }
            }
            throw ex;
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);
                    conn.close();
                } catch (SQLException ignored) {}
            }
        }
    }

    private Ingredient mapResultSetToIngredient(ResultSet rs) throws SQLException {
        String id = rs.getString("id");
        String name = rs.getString("name");
        Category category = Category.fromString(rs.getString("category"));
        double quantity = rs.getDouble("quantity");
        String unit = rs.getString("unit");
        double minThreshold = rs.getDouble("min_threshold");
        double unitPrice = rs.getDouble("unit_price");
        String expStr = rs.getString("expiry_date");
        LocalDate expiryDate = null;
        if (expStr != null && !expStr.trim().isEmpty()) {
            try { expiryDate = LocalDate.parse(expStr.trim()); } catch (Exception ignored) {}
        }
        String location = rs.getString("location");

        return new Ingredient(id, name, category, quantity, unit, minThreshold, unitPrice, expiryDate, location);
    }
}
