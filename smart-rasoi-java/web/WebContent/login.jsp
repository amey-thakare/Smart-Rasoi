<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Smart Rasoi — Academic Login</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 40px 20px; }
        .card { max-width: 440px; margin: 40px auto; background: white; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
        h2 { margin-top: 0; color: #0f172a; }
        .form-group { margin-bottom: 18px; }
        label { display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px; }
        input[type="email"], input[type="password"] { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; }
        .btn-submit { width: 100%; background: #2563eb; color: white; padding: 12px; border: none; border-radius: 6px; font-weight: 600; font-size: 15px; cursor: pointer; }
        .error-banner { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 12px; border-radius: 6px; margin-bottom: 18px; font-size: 14px; }
        .success-banner { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; padding: 12px; border-radius: 6px; margin-bottom: 18px; font-size: 14px; }
        .footer-note { margin-top: 20px; font-size: 13px; text-align: center; color: #64748b; }
        .footer-note a { color: #2563eb; text-decoration: none; }
    </style>
</head>
<body>
<div class="card">
    <h2>Academic Session Login</h2>
    <p style="font-size: 13px; color: #64748b; margin-top: -6px;">Demonstrating Unit 6 Servlet Authentication &amp; Sessions</p>

    <%-- Error message via JSP Expression Language (EL) --%>
    <% if (request.getAttribute("errorMessage") != null) { %>
        <div class="error-banner">${errorMessage}</div>
    <% } %>

    <% if (request.getParameter("loggedOut") != null) { %>
        <div class="success-banner">You have been logged out successfully. Session invalidated.</div>
    <% } %>

    <form action="${pageContext.request.contextPath}/login" method="post">
        <div class="form-group">
            <label for="email">Student / Faculty Email:</label>
            <input type="email" id="email" name="email" value="student@smartrasoi.ac.in" required>
        </div>

        <div class="form-group">
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" value="RasoiPass2026!" required>
        </div>

        <button type="submit" class="btn-submit">Sign In (POST to LoginServlet)</button>
    </form>

    <div class="footer-note">
        Default Academic Credentials: <code>student@smartrasoi.ac.in</code> / <code>RasoiPass2026!</code><br><br>
        Need an account? <a href="${pageContext.request.contextPath}/register">Register here</a> |
        <a href="${pageContext.request.contextPath}/index.jsp">Back to Home</a>
    </div>
</div>
</body>
</html>
