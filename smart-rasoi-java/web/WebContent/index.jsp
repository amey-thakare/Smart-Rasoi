<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Smart Rasoi — Java Academic Web Layer</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 40px 20px; }
        .container { max-width: 800px; margin: 0 auto; background: #ffffff; padding: 36px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
        h1 { color: #0f172a; margin-top: 0; }
        .badge { background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 9999px; font-size: 13px; font-weight: 600; display: inline-block; }
        .nav-links { display: flex; gap: 14px; margin: 24px 0; }
        .btn { display: inline-block; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; }
        .btn-primary { background: #2563eb; color: #ffffff; }
        .btn-secondary { background: #e2e8f0; color: #334155; }
        .info-box { background: #f1f5f9; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px; font-size: 14px; }
        ul { line-height: 1.8; }
    </style>
</head>
<body>
<div class="container">
    <span class="badge">Syllabus Units 6 &amp; 7 Layer</span>
    <h1>Smart Rasoi — Academic Web Demonstration Layer</h1>
    <p>This standalone Java Web module demonstrates university syllabus concepts in Servlets, JSP, JavaBeans, and Session Tracking.</p>

    <div class="info-box">
        <strong>Academic Isolation Notice:</strong> The primary Smart Rasoi application continues to run on its Node.js/React stack via <code>npm run dev</code>. This module serves exclusively for academic faculty assessment of Java Enterprise concepts.
    </div>

    <div class="nav-links">
        <a href="${pageContext.request.contextPath}/login" class="btn btn-primary">Go to Academic Login</a>
        <a href="${pageContext.request.contextPath}/register" class="btn btn-secondary">Student Registration</a>
        <a href="${pageContext.request.contextPath}/scriptlet_demo.jsp" class="btn btn-secondary">Syllabus Scriptlets Demo</a>
    </div>

    <h3>Syllabus Concepts Demonstrated in this Web Module:</h3>
    <ul>
        <li><strong>Unit 6: Servlets:</strong> <code>LoginServlet</code>, <code>RegisterServlet</code>, <code>InventoryServlet</code>, <code>LogoutServlet</code></li>
        <li><strong>Unit 6: Lifecycle:</strong> <code>init()</code>, <code>service()</code>, <code>doGet()</code>, <code>doPost()</code>, <code>destroy()</code></li>
        <li><strong>Unit 6: Deployment:</strong> <code>web.xml</code> deployment descriptor with servlet-mapping and session-config</li>
        <li><strong>Unit 6: Session Tracking:</strong> <code>HttpSession</code> with salted password authentication and timeout</li>
        <li><strong>Unit 7: JavaBeans:</strong> <code>IngredientBean</code> and <code>RecipeBean</code> complying with JavaBean conventions</li>
        <li><strong>Unit 7: JSP:</strong> Directives, Expression Language (EL), Custom Tags (<code>rasoi:currency</code>)</li>
        <li><strong>Unit 7: Legacy Syntax:</strong> Declarations, Expressions, and Scriptlets in educational sandbox</li>
    </ul>
</div>
</body>
</html>
