package com.smartrasoi.exception;

/**
 * Unit 3 Syllabus Topic: Exception Handling - User Defined Checked Exception.
 *
 * Demonstrates:
 * - Creating custom checked exception hierarchy by extending java.lang.Exception
 * - Exception chaining using cause Throwable
 * - Custom error code handling
 */
public class KitchenException extends Exception {

    private static final long serialVersionUID = 1L;
    private final String errorCode;

    public KitchenException(String message) {
        super(message);
        this.errorCode = "KITCHEN_ERR_GENERIC";
    }

    public KitchenException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public KitchenException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "KITCHEN_ERR_WRAPPED";
    }

    public String getErrorCode() {
        return errorCode;
    }

    @Override
    public String toString() {
        return String.format("[%s] %s", errorCode, getMessage());
    }
}
