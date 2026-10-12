<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.util.List" %>
<%@ page import="com.smartrasoi.web.IngredientBean" %>
<%@ taglib uri="http://smartrasoi.com/tags" prefix="rasoi" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Smart Rasoi — Academic Inventory View</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
        .header { display: flex; justify-content: space-between; align-items: center; background: white; padding: 18px 24px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-bottom: 24px; }
        .header h1 { margin: 0; font-size: 22px; color: #0f172a; }
        .user-info { display: flex; align-items: center; gap: 14px; }
        .btn-logout { background: #fee2e2; color: #dc2626; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 13px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: white; padding: 18px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
        .stat-title { font-size: 13px; color: #64748b; margin-bottom: 4px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        th, td { padding: 14px 18px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        th { background: #f1f5f9; color: #475569; font-weight: 600; }
        .form-section { background: white; padding: 24px; border-radius: 8px; margin-top: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .form-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto; gap: 12px; align-items: flex-end; }
        input, select { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; width: 100%; box-sizing: border-box; }
        .btn-add { background: #2563eb; color: white; border: none; padding: 10px 18px; border-radius: 6px; font-weight: 600; cursor: pointer; }
        .bean-demo { background: #e0f2fe; border: 1px dashed #0284c7; padding: 16px; border-radius: 8px; margin-bottom: 24px; font-size: 13px; }
    </style>
</head>
<body>

<%-- Session Check (Unit 6 Session Tracking) --%>
<%
    if (session.getAttribute("user") == null) {
        response.sendRedirect(request.getContextPath() + "/login?error=unauthorized");
        return;
    }
%>

<div class="header">
    <div>
        <h1>Smart Rasoi — Pantry Inventory</h1>
        <div style="font-size: 13px; color: #64748b; margin-top: 4px;">MVC View powered by JSP, Expression Language &amp; JavaBeans</div>
    </div>
    <div class="user-info">
        <span>Logged in as: <strong>${sessionScope.userName}</strong> (${sessionScope.userEmail})</span>
        <a href="${pageContext.request.contextPath}/logout" class="btn-logout">Logout (Invalidate Session)</a>
    </div>
</div>

<%-- Unit 7 Concept Demonstration: <jsp:useBean> Standard Tag --%>
<div class="bean-demo">
    <jsp:useBean id="sampleItem" class="com.smartrasoi.web.IngredientBean" scope="page" />
    <jsp:setProperty name="sampleItem" property="name" value="Basmati Rice Gold" />
    <jsp:setProperty name="sampleItem" property="quantity" value="5.0" />
    <jsp:setProperty name="sampleItem" property="unitPrice" value="110.0" />

    <strong>Unit 7 Syllabus Concept — JSP Standard Actions &lt;jsp:useBean&gt;:</strong><br>
    Sample Bean created via &lt;jsp:useBean&gt;:
    <strong><jsp:getProperty name="sampleItem" property="name" /></strong> |
    Quantity: <strong><jsp:getProperty name="sampleItem" property="quantity" /> kg</strong> |
    Unit Price: <strong>₹<jsp:getProperty name="sampleItem" property="unitPrice" /></strong> |
    Computed Stock Value: <strong>₹${sampleItem.stockValue}</strong>
</div>

<div class="stats-grid">
    <div class="stat-card">
        <div class="stat-title">Total Tracked Items</div>
        <div class="stat-value">${totalCount}</div>
    </div>
    <div class="stat-card">
        <div class="stat-title">Estimated Valuation</div>
        <div class="stat-value">₹${totalValuation}</div>
    </div>
    <div class="stat-card">
        <div class="stat-title">Low Stock Items</div>
        <div class="stat-value" style="color: #dc2626;">${lowStockCount}</div>
    </div>
</div>

<table>
    <thead>
        <tr>
            <th>ID</th>
            <th>Ingredient Name</th>
            <th>Category</th>
            <th>Current Quantity</th>
            <th>Unit Price (Custom Tag)</th>
            <th>Total Stock Value (EL)</th>
            <th>Location</th>
            <th>Action</th>
        </tr>
    </thead>
    <tbody>
        <%-- Looping through List<IngredientBean> passed from InventoryServlet --%>
        <%
            List<IngredientBean> items = (List<IngredientBean>) request.getAttribute("inventoryItems");
            if (items != null && !items.isEmpty()) {
                for (IngredientBean item : items) {
                    pageContext.setAttribute("item", item);
        %>
        <tr>
            <td><code>${item.id}</code></td>
            <td><strong>${item.name}</strong></td>
            <td>${item.category}</td>
            <td>${item.quantity} ${item.unit}</td>
            <td>
                <%-- Custom JSP Tag from Unit 7 --%>
                <rasoi:currency amount="${item.unitPrice}" />
            </td>
            <td>₹${item.stockValue}</td>
            <td>${item.location}</td>
            <td>
                <form action="${pageContext.request.contextPath}/inventory" method="post" style="display:inline;">
                    <input type="hidden" name="action" value="delete">
                    <input type="hidden" name="id" value="${item.id}">
                    <button type="submit" style="background:#fee2e2; color:#dc2626; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Delete</button>
                </form>
            </td>
        </tr>
        <%
                }
            } else {
        %>
        <tr>
            <td colspan="8" style="text-align: center; color: #64748b; padding: 24px;">No ingredients found in database. Add your first item below!</td>
        </tr>
        <%
            }
        %>
    </tbody>
</table>

<div class="form-section">
    <h3 style="margin-top:0;">Add New Ingredient (Form Submission to InventoryServlet)</h3>
    <form action="${pageContext.request.contextPath}/inventory" method="post">
        <div class="form-row">
            <div>
                <label style="font-size:12px; display:block; margin-bottom:4px;">Item Name:</label>
                <input type="text" name="name" placeholder="e.g. Green Chillies" required>
            </div>
            <div>
                <label style="font-size:12px; display:block; margin-bottom:4px;">Category:</label>
                <select name="category">
                    <option value="GRAIN">GRAIN</option>
                    <option value="PULSE">PULSE</option>
                    <option value="SPICE">SPICE</option>
                    <option value="DAIRY">DAIRY</option>
                    <option value="VEGETABLE">VEGETABLE</option>
                    <option value="OIL">OIL</option>
                </select>
            </div>
            <div>
                <label style="font-size:12px; display:block; margin-bottom:4px;">Quantity:</label>
                <input type="number" step="0.1" name="quantity" placeholder="1.0" required>
            </div>
            <div>
                <label style="font-size:12px; display:block; margin-bottom:4px;">Unit:</label>
                <select name="unit">
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="l">l</option>
                    <option value="ml">ml</option>
                    <option value="piece">piece</option>
                </select>
            </div>
            <div>
                <label style="font-size:12px; display:block; margin-bottom:4px;">Unit Price (₹):</label>
                <input type="number" step="0.5" name="unitPrice" placeholder="50.0" required>
            </div>
            <div>
                <button type="submit" class="btn-add">Add to Pantry</button>
            </div>
        </div>
    </form>
</div>

</body>
</html>
