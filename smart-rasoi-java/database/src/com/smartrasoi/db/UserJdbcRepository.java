package com.smartrasoi.db;

import com.smartrasoi.exception.DuplicateUserException;
import com.smartrasoi.model.User;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Unit 5 & Requirement 11: User Authentication & Registration via JDBC.
 *
 * Demonstrates:
 * - PreparedStatements for parameterized queries (SQL injection prevention)
 * - Salted password hashing (never storing plaintext passwords)
 * - Rejection of duplicate email addresses
 * - Timing-safe password validation
 */
public class UserJdbcRepository {

    private final DatabaseConnection db;

    public UserJdbcRepository() {
        this.db = DatabaseConnection.getInstance();
    }

    public UserJdbcRepository(DatabaseConnection db) {
        this.db = db;
    }

    /**
     * Registers a new user.
     * Hashes password with random salt before saving to SQLite database.
     * Throws DuplicateUserException if email already registered.
     */
    public User registerUser(String name, String email, String rawPassword) throws SQLException, DuplicateUserException {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("User name is required.");
        }
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("Valid email address is required.");
        }

        String cleanEmail = email.trim().toLowerCase();

        // 1. Check for duplicate email
        if (findByEmail(cleanEmail).isPresent()) {
            throw new DuplicateUserException(cleanEmail);
        }

        // 2. Create User model and securely hash password using standard Java crypto
        String userId = "USR-" + UUID.randomUUID().toString().substring(0, 8);
        User user = new User(userId, name, cleanEmail);
        user.setAndHashPassword(rawPassword);

        // 3. Persist to SQLite using PreparedStatement
        String sql = "INSERT INTO users (id, name, email, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = db.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, user.getId());
            pstmt.setString(2, user.getName());
            pstmt.setString(3, user.getEmail());
            pstmt.setString(4, user.getPasswordHash());
            pstmt.setString(5, user.getSalt());
            pstmt.setString(6, user.getCreatedAt().toString());

            pstmt.executeUpdate();
        }

        return user;
    }

    /**
     * Authenticates a user candidate.
     * Retrieves user by email and verifies password against salted hash.
     */
    public Optional<User> authenticate(String email, String rawPassword) throws SQLException {
        if (email == null || rawPassword == null) {
            return Optional.empty();
        }

        Optional<User> userOpt = findByEmail(email.trim().toLowerCase());
        if (!userOpt.isPresent()) {
            return Optional.empty();
        }

        User user = userOpt.get();
        if (user.verifyPassword(rawPassword)) {
            return Optional.of(user);
        }

        return Optional.empty();
    }

    public Optional<User> findByEmail(String email) throws SQLException {
        String sql = "SELECT * FROM users WHERE LOWER(email) = LOWER(?)";

        try (Connection conn = db.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, email);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapResultSetToUser(rs));
                }
            }
        }
        return Optional.empty();
    }

    public Optional<User> findById(String id) throws SQLException {
        String sql = "SELECT * FROM users WHERE id = ?";

        try (Connection conn = db.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, id);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapResultSetToUser(rs));
                }
            }
        }
        return Optional.empty();
    }

    private User mapResultSetToUser(ResultSet rs) throws SQLException {
        String id = rs.getString("id");
        String name = rs.getString("name");
        String email = rs.getString("email");
        String passwordHash = rs.getString("password_hash");
        String salt = rs.getString("salt");
        String createdStr = rs.getString("created_at");
        LocalDateTime created = LocalDateTime.now();
        if (createdStr != null) {
            try { created = LocalDateTime.parse(createdStr); } catch (Exception ignored) {}
        }
        return new User(id, name, email, passwordHash, salt, created);
    }
}
