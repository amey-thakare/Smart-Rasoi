package com.smartrasoi.db;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Unit 5 Syllabus Topic: JDBC Connection Management.
 *
 * Demonstrates:
 * - Loading JDBC Driver bytecode dynamically (Class.forName)
 * - Establishing Connection via DriverManager
 * - Singleton design pattern for connection configuration
 * - Executing DDL statements via Statement
 * - Transaction control helpers
 */
public class DatabaseConnection {

    private static final String DEFAULT_DB_URL = "jdbc:sqlite:smart-rasoi-java/smart_rasoi_academic.db";
    private static DatabaseConnection instance;
    private final String dbUrl;

    private DatabaseConnection() {
        this(DEFAULT_DB_URL);
    }

    private DatabaseConnection(String dbUrl) {
        this.dbUrl = dbUrl;
        try {
            // Unit 5: Dynamic class loading of JDBC Driver
            Class.forName("org.sqlite.JDBC");
        } catch (ClassNotFoundException e) {
            System.err.println("[DatabaseConnection] SQLite JDBC driver not on classpath. Ensure sqlite-jdbc jar is included.");
        }
    }

    public static synchronized DatabaseConnection getInstance() {
        if (instance == null) {
            instance = new DatabaseConnection();
        }
        return instance;
    }

    public static synchronized DatabaseConnection getInstance(String customUrl) {
        if (instance == null) {
            instance = new DatabaseConnection(customUrl);
        }
        return instance;
    }

    /**
     * Obtains a fresh JDBC Connection.
     * Callers must close connection using try-with-resources.
     *
     * @return open java.sql.Connection
     * @throws SQLException on database connection error
     */
    public Connection getConnection() throws SQLException {
        return DriverManager.getConnection(this.dbUrl);
    }

    /**
     * Initializes database schema by creating all required tables.
     * Demonstrates Statement and batch execution.
     */
    public void initializeDatabase() throws SQLException {
        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement()) {

            // DDL: Create tables directly
            stmt.execute("CREATE TABLE IF NOT EXISTS users (" +
                    "id TEXT PRIMARY KEY, " +
                    "name TEXT NOT NULL, " +
                    "email TEXT UNIQUE NOT NULL, " +
                    "password_hash TEXT NOT NULL, " +
                    "salt TEXT NOT NULL, " +
                    "created_at TEXT NOT NULL);");

            stmt.execute("CREATE TABLE IF NOT EXISTS ingredients (" +
                    "id TEXT PRIMARY KEY, " +
                    "name TEXT NOT NULL, " +
                    "category TEXT NOT NULL, " +
                    "quantity REAL NOT NULL, " +
                    "unit TEXT NOT NULL, " +
                    "min_threshold REAL NOT NULL DEFAULT 1.0, " +
                    "unit_price REAL NOT NULL DEFAULT 0.0, " +
                    "expiry_date TEXT, " +
                    "location TEXT DEFAULT 'Pantry');");

            stmt.execute("CREATE TABLE IF NOT EXISTS recipes (" +
                    "id TEXT PRIMARY KEY, " +
                    "title TEXT NOT NULL, " +
                    "description TEXT, " +
                    "category TEXT NOT NULL, " +
                    "cuisine TEXT DEFAULT 'Indian', " +
                    "difficulty TEXT DEFAULT 'Easy', " +
                    "prep_time_minutes INTEGER NOT NULL DEFAULT 15, " +
                    "cook_time_minutes INTEGER NOT NULL DEFAULT 20, " +
                    "servings INTEGER NOT NULL DEFAULT 2, " +
                    "instructions_json TEXT, " +
                    "is_shared INTEGER DEFAULT 1);");

            stmt.execute("CREATE TABLE IF NOT EXISTS shopping_lists (" +
                    "id TEXT PRIMARY KEY, " +
                    "user_id TEXT NOT NULL, " +
                    "name TEXT NOT NULL, " +
                    "budget REAL NOT NULL DEFAULT 0.0, " +
                    "status TEXT NOT NULL DEFAULT 'ACTIVE', " +
                    "created_at TEXT NOT NULL);");

            stmt.execute("CREATE TABLE IF NOT EXISTS shopping_list_items (" +
                    "id TEXT PRIMARY KEY, " +
                    "shopping_list_id TEXT NOT NULL, " +
                    "name TEXT NOT NULL, " +
                    "category TEXT NOT NULL, " +
                    "quantity REAL NOT NULL, " +
                    "unit TEXT NOT NULL, " +
                    "estimated_price REAL NOT NULL DEFAULT 0.0, " +
                    "actual_price REAL NOT NULL DEFAULT 0.0, " +
                    "is_purchased INTEGER DEFAULT 0, " +
                    "is_added_to_inventory INTEGER DEFAULT 0);");
        }
    }
}
