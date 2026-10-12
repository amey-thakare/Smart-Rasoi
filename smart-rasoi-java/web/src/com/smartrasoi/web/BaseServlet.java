package com.smartrasoi.web;

import com.smartrasoi.db.DataSeeder;
import com.smartrasoi.db.DatabaseConnection;
import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

/**
 * Unit 6 Syllabus Topic: Servlet Lifecycle & Base Controller.
 *
 * Demonstrates:
 * - Extending javax.servlet.http.HttpServlet
 * - Overriding init(ServletConfig) lifecycle method
 * - Database bootstrapping upon servlet initialization
 * - Session validation helper methods
 */
public abstract class BaseServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    protected DatabaseConnection db;

    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        try {
            this.db = DatabaseConnection.getInstance();
            this.db.initializeDatabase();
            DataSeeder seeder = new DataSeeder(this.db);
            seeder.seedAll();
        } catch (Exception e) {
            throw new ServletException("Failed to initialize database during servlet init()", e);
        }
    }

    protected boolean isAuthenticated(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        return session != null && session.getAttribute("user") != null;
    }
}
