package com.smartrasoi.model;

import com.smartrasoi.util.SmartRasoiEntity;
import java.io.Serializable;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

/**
 * Unit 2 & Requirement 11: User Domain Model and Cryptographic Security.
 *
 * Demonstrates:
 * - Encapsulation of user credentials
 * - Standard Java Cryptography API (MessageDigest SHA-256 + SecureRandom salt)
 * - Safe password verification (timing-safe check, never storing or logging plaintext passwords)
 */
@SmartRasoiEntity(tableName = "users", description = "Application user with secure salted password credentials")
public class User implements Serializable {

    private static final long serialVersionUID = 1L;

    private String id;
    private String name;
    private String email;
    private String passwordHash;
    private String salt;
    private LocalDateTime createdAt;

    public User() {
        this(null, "", "");
    }

    public User(String id, String name, String email) {
        this.id = id;
        this.name = (name != null) ? name.trim() : "";
        this.email = (email != null) ? email.trim().toLowerCase() : "";
        this.passwordHash = "";
        this.salt = "";
        this.createdAt = LocalDateTime.now();
    }

    public User(String id, String name, String email, String passwordHash, String salt, LocalDateTime createdAt) {
        this.id = id;
        this.name = (name != null) ? name.trim() : "";
        this.email = (email != null) ? email.trim().toLowerCase() : "";
        this.passwordHash = passwordHash;
        this.salt = salt;
        this.createdAt = (createdAt != null) ? createdAt : LocalDateTime.now();
    }

    // ========================================================
    // REQUIREMENT 11: STANDARD JAVA PASSWORD HASHING (SALTED)
    // ========================================================

    /**
     * Hashes and sets the user's password using salted SHA-256 from standard Java APIs.
     * Generates a fresh 16-byte cryptographically secure salt.
     *
     * @param rawPassword plaintext password to hash
     */
    public void setAndHashPassword(String rawPassword) {
        if (rawPassword == null || rawPassword.trim().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long.");
        }
        // 1. Generate 16-byte random salt using SecureRandom
        byte[] saltBytes = new byte[16];
        new SecureRandom().nextBytes(saltBytes);
        this.salt = Base64.getEncoder().encodeToString(saltBytes);

        // 2. Hash raw password with salt using SHA-256 MessageDigest
        this.passwordHash = computeHash(rawPassword, this.salt);
    }

    /**
     * Verifies if a given plaintext password matches this user's stored hash.
     *
     * @param rawCandidate password candidate submitted during login
     * @return true if password matches, false otherwise
     */
    public boolean verifyPassword(String rawCandidate) {
        if (rawCandidate == null || this.passwordHash == null || this.salt == null) {
            return false;
        }
        String candidateHash = computeHash(rawCandidate, this.salt);
        // MessageDigest.isEqual provides constant-time comparison to protect against timing attacks
        return MessageDigest.isEqual(
                candidateHash.getBytes(StandardCharsets.UTF_8),
                this.passwordHash.getBytes(StandardCharsets.UTF_8)
        );
    }

    /**
     * Utility method: computes salted SHA-256 hash.
     */
    public static String computeHash(String password, String saltBase64) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] saltBytes = Base64.getDecoder().decode(saltBase64);
            digest.update(saltBytes);
            byte[] hashBytes = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Standard SHA-256 algorithm missing from JVM", e);
        }
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = (name != null) ? name.trim() : ""; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = (email != null) ? email.trim().toLowerCase() : ""; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getSalt() { return salt; }
    public void setSalt(String salt) { this.salt = salt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @Override
    public String toString() {
        return String.format("User [id=%s, name=%s, email=%s]", id, name, email);
    }
}
