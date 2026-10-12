package com.smartrasoi.exception;

/**
 * Unit 3 Syllabus Topic: User-Defined Checked Exception.
 *
 * Thrown during user registration or profile updates when an email address
 * is already registered in the system.
 */
public class DuplicateUserException extends KitchenException {

    private static final long serialVersionUID = 1L;
    private final String email;

    public DuplicateUserException(String email) {
        super(String.format("User registration failed: Email '%s' is already in use.", email), "ERR_DUPLICATE_USER");
        this.email = email;
    }

    public String getEmail() {
        return email;
    }
}
