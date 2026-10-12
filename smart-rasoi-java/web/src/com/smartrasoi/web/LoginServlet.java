package com.smartrasoi.web;

import com.smartrasoi.db.UserJdbcRepository;
import com.smartrasoi.model.User;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.sql.SQLException;
import java.util.Optional;

/**
 * Unit 6 Syllabus Topic: HttpServlet, doGet, doPost, Request Parameters & Session Tracking.
 *
 * Demonstrates:
 * - Handling HTTP GET to present login form
 * - Handling HTTP POST to process login submission
 * - Extracting parameters via request.getParameter()
 * - Authenticating with salted cryptographic password check
 * - Session creation: request.getSession(true)
 * - Storing session state: session.setAttribute("user", user)
 * - RequestDispatcher forwarding vs sendRedirect
 */
public class LoginServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        // If already logged in, redirect directly to inventory
        if (isAuthenticated(request)) {
            response.sendRedirect(request.getContextPath() + "/inventory");
            return;
        }
        request.getRequestDispatcher("/login.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String email = request.getParameter("email");
        String password = request.getParameter("password");

        // Input validation
        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            request.setAttribute("errorMessage", "Email and password are required.");
            request.getRequestDispatcher("/login.jsp").forward(request, response);
            return;
        }

        UserJdbcRepository userRepo = new UserJdbcRepository(this.db);
        try {
            Optional<User> userOpt = userRepo.authenticate(email.trim(), password);

            if (userOpt.isPresent()) {
                User user = userOpt.get();

                // Unit 6 Topic: Session Tracking
                // Creates a new session if none exists, or retrieves active session
                HttpSession session = request.getSession(true);
                session.setAttribute("user", user);
                session.setAttribute("userName", user.getName());
                session.setAttribute("userEmail", user.getEmail());

                // Set session timeout to 30 minutes (1800 seconds)
                session.setMaxInactiveInterval(1800);

                response.sendRedirect(request.getContextPath() + "/inventory");
            } else {
                request.setAttribute("errorMessage", "Invalid email or password. Please try again.");
                request.getRequestDispatcher("/login.jsp").forward(request, response);
            }
        } catch (SQLException e) {
            request.setAttribute("errorMessage", "Database error during authentication: " + e.getMessage());
            request.getRequestDispatcher("/login.jsp").forward(request, response);
        }
    }
}
