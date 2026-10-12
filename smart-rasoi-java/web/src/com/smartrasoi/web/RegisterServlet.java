package com.smartrasoi.web;

import com.smartrasoi.db.UserJdbcRepository;
import com.smartrasoi.exception.DuplicateUserException;
import com.smartrasoi.model.User;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.sql.SQLException;

/**
 * Unit 6 & Requirement 11: Registration Servlet.
 *
 * Demonstrates:
 * - Handling registration POST requests
 * - Form validation
 * - Salted SHA-256 password hashing
 * - Duplicate user conflict handling
 * - Post-Redirect-Get pattern
 */
public class RegisterServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        request.getRequestDispatcher("/register.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String name = request.getParameter("name");
        String email = request.getParameter("email");
        String password = request.getParameter("password");
        String confirmPassword = request.getParameter("confirmPassword");

        // Validation
        if (name == null || name.trim().isEmpty() || email == null || email.trim().isEmpty() ||
            password == null || password.trim().isEmpty()) {
            request.setAttribute("errorMessage", "All registration fields are mandatory.");
            request.getRequestDispatcher("/register.jsp").forward(request, response);
            return;
        }

        if (password.length() < 6) {
            request.setAttribute("errorMessage", "Password must be at least 6 characters long.");
            request.getRequestDispatcher("/register.jsp").forward(request, response);
            return;
        }

        if (!password.equals(confirmPassword)) {
            request.setAttribute("errorMessage", "Passwords do not match.");
            request.getRequestDispatcher("/register.jsp").forward(request, response);
            return;
        }

        UserJdbcRepository userRepo = new UserJdbcRepository(this.db);
        try {
            User user = userRepo.registerUser(name.trim(), email.trim(), password);

            // Automatically establish session for registered user
            HttpSession session = request.getSession(true);
            session.setAttribute("user", user);
            session.setAttribute("userName", user.getName());
            session.setAttribute("userEmail", user.getEmail());

            response.sendRedirect(request.getContextPath() + "/inventory?registered=true");
        } catch (DuplicateUserException e) {
            request.setAttribute("errorMessage", "An account with email " + email + " already exists. Please log in.");
            request.getRequestDispatcher("/register.jsp").forward(request, response);
        } catch (SQLException e) {
            request.setAttribute("errorMessage", "Database error: " + e.getMessage());
            request.getRequestDispatcher("/register.jsp").forward(request, response);
        }
    }
}
