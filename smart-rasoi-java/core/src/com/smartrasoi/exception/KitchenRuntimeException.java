package com.smartrasoi.exception;

/**
 * Unit 3 Syllabus Topic: Checked vs Unchecked Exceptions.
 *
 * Demonstrates:
 * - Unchecked exception (inheriting from java.lang.RuntimeException)
 * - Contrast with checked KitchenException (which inherits from java.lang.Exception)
 * - The compiler does not enforce try-catch or throws clauses for unchecked exceptions.
 */
public class KitchenRuntimeException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public KitchenRuntimeException(String message) {
        super(message);
    }

    public KitchenRuntimeException(String message, Throwable cause) {
        super(message, cause);
    }
}
