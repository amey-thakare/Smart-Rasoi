<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Smart Rasoi — Academic Registration</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 40px 20px; }
        .card { max-width: 460px; margin: 40px auto; background: white; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
        h2 { margin-top: 0; color: #0f172a; }
        .form-group { margin-bottom: 16px; }
        label { display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px; }
        input[type="text"], input[type="email"], input[type="password"] { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; }
        .btn-submit { width: 100%; background: #059669; color: white; padding: 12px; border: none; border-radius: 6px; font-weight: 600; font-size: 15px; cursor: pointer; }
        .error-banner { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 12px; border-radius: 6px; margin-bottom: 18px; font-size: 14px; }
        .footer-note { margin-top: 20px; font-size: 13px; text-align: center; color: #64748b; }
        .footer-note a { color: #059669; text-decoration: none; }
    </style>
</head>
<body>
<div class="card">
    <h2>Student / Faculty Registration</h2>
    <p style="font-size: 13px; color: #64748b; margin-top: -6px;">Demonstrating Unit 11 Salted SHA-256 Crypto &amp; PreparedStatement</p>

    <% if (request.getAttribute("errorMessage") != null) { %>
        <div class="error-banner">${errorMessage}</div>
    <% } %>

    <form action="${pageContext.request.contextPath}/register" method="post">
        <div class="form-group">
            <label for="name">Full Name:</label>
            <input type="text" id="name" name="name" placeholder="Prof. Sharma / Ananya Verma" required>
        </div>

        <div class="form-group">
            <label for="email">Academic Email:</label>
            <input type="email" id="email" name="email" placeholder="student@smartrasoi.ac.in" required>
        </div>

        <div class="form-group">
            <label for="password">Password (min 6 characters):</label>
            <input type="password" id="password" name="password" required>
        </div>

        <div class="form-group">
            <label for="confirmPassword">Confirm Password:</label>
            <input type="password" id="confirmPassword" name="confirmPassword" required>
        </div>

        <button type="submit" class="btn-submit">Register Account (POST to RegisterServlet)</button>
    </form>

    <div class="footer-note">
        Already have an academic account? <a href="${pageContext.request.contextPath}/login">Sign in</a> |
        <a href="${pageContext.request.contextPath}/index.jsp">Back to Home</a>
    </div>
</div>
</body>
</html>
