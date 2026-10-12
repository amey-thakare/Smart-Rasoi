package com.smartrasoi.web;

import com.smartrasoi.db.IngredientJdbcRepository;
import com.smartrasoi.model.Category;
import com.smartrasoi.model.Ingredient;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Unit 6 & 7 Syllabus Topic: Protected Route Controller, MVC Architecture & JavaBeans.
 *
 * Demonstrates:
 * - Acting as the Controller in the Model-View-Controller (MVC) architecture
 * - Session verification (protected page access)
 * - Fetching domain data using JDBC service
 * - Populating JavaBeans (IngredientBean) for view presentation
 * - Setting request attributes and forwarding to JSP View
 */
public class InventoryServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        // 1. Session verification (Protected Route)
        if (!isAuthenticated(request)) {
            response.sendRedirect(request.getContextPath() + "/login?error=unauthorized");
            return;
        }

        IngredientJdbcRepository repo = new IngredientJdbcRepository(this.db);
        try {
            // 2. Query data using JDBC repository (Never in JSP!)
            List<Ingredient> ingredients = repo.findAll();

            // 3. Map to JavaBeans for presentation in JSP
            List<IngredientBean> beans = new ArrayList<>();
            double totalValuation = 0.0;
            int lowStockCount = 0;

            for (Ingredient item : ingredients) {
                IngredientBean bean = new IngredientBean(
                        item.getId(),
                        item.getName(),
                        item.getCategory().name(),
                        item.getQuantity(),
                        item.getUnit(),
                        item.getUnitPrice(),
                        item.getExpiryDate() != null ? item.getExpiryDate().toString() : "N/A",
                        item.getLocation()
                );
                beans.add(bean);
                totalValuation += item.calculateStockValue();
                if (item.isLowStock()) {
                    lowStockCount++;
                }
            }

            // 4. Set Request Attributes (Unit 6 & 7)
            request.setAttribute("inventoryItems", beans);
            request.setAttribute("totalCount", beans.size());
            request.setAttribute("totalValuation", totalValuation);
            request.setAttribute("lowStockCount", lowStockCount);

            // 5. Forward to View (inventory.jsp)
            request.getRequestDispatcher("/inventory.jsp").forward(request, response);

        } catch (SQLException e) {
            throw new ServletException("Database error loading inventory", e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        if (!isAuthenticated(request)) {
            response.sendRedirect(request.getContextPath() + "/login");
            return;
        }

        String action = request.getParameter("action");
        IngredientJdbcRepository repo = new IngredientJdbcRepository(this.db);

        try {
            if ("delete".equalsIgnoreCase(action)) {
                String id = request.getParameter("id");
                if (id != null) {
                    repo.deleteById(id);
                }
            } else {
                // Add new ingredient
                String name = request.getParameter("name");
                String categoryStr = request.getParameter("category");
                String quantityStr = request.getParameter("quantity");
                String unit = request.getParameter("unit");
                String priceStr = request.getParameter("unitPrice");

                if (name != null && !name.trim().isEmpty()) {
                    double quantity = parseDoubleSafe(quantityStr);
                    double unitPrice = parseDoubleSafe(priceStr);
                    Category cat = Category.fromString(categoryStr);

                    Ingredient newItem = new Ingredient(
                            "ING-" + UUID.randomUUID().toString().substring(0, 8),
                            name.trim(),
                            cat,
                            quantity,
                            (unit != null ? unit.trim() : "kg"),
                            1.0,
                            unitPrice,
                            LocalDate.now().plusMonths(6),
                            "Pantry"
                    );
                    repo.insert(newItem);
                }
            }
            // Post-Redirect-Get pattern
            response.sendRedirect(request.getContextPath() + "/inventory");

        } catch (SQLException e) {
            throw new ServletException("Failed to update inventory", e);
        }
    }

    private double parseDoubleSafe(String val) {
        try {
            return Double.parseDouble(val.trim());
        } catch (Exception e) {
            return 0.0;
        }
    }
}
