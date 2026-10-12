<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Smart Rasoi — JSP Scripting Elements Educational Demonstration</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 36px 20px; }
        .container { max-width: 820px; margin: 0 auto; background: white; padding: 36px; border-radius: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.06); }
        h1 { margin-top: 0; color: #0f172a; }
        .academic-warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 14px; line-height: 1.5; }
        .code-card { background: #f1f5f9; padding: 18px; border-radius: 8px; margin: 18px 0; border: 1px solid #e2e8f0; }
        .code-title { font-weight: bold; color: #0f172a; margin-bottom: 8px; font-size: 15px; }
        pre { background: #0f172a; color: #38bdf8; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px; overflow-x: auto; }
        .live-output { background: white; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; margin-top: 10px; font-weight: 500; }
        .btn-back { display: inline-block; margin-top: 24px; padding: 10px 18px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
    </style>
</head>
<body>
<div class="container">
    <h1>JSP Scripting Elements — Educational Demonstration</h1>

    <div class="academic-warning">
        <strong>⚠️ ACADEMIC SYLLABUS LEARNING EXAMPLE:</strong><br>
        This page demonstrates legacy JSP scripting elements (<strong>Declarations</strong>, <strong>Expressions</strong>, and <strong>Scriptlets</strong>) as mandated by University Syllabus Unit 7.<br><br>
        <strong>Industry Best Practice Note:</strong> In modern enterprise Java, embedding Java code directly in JSP pages violates MVC separation of concerns and creates maintenance, security, and debugging issues. Modern applications use <strong>Servlet Controllers</strong> for business logic, <strong>JavaBeans / DTOs</strong> for data transfer, and <strong>Expression Language (EL) / JSTL tags</strong> for presentation.
    </div>

    <!-- ================================================================= -->
    <!-- 1. JSP DECLARATION (<%! ... %>)                                   -->
    <!-- ================================================================= -->
    <div class="code-card">
        <div class="code-title">1. JSP Declaration Tag: <code>&lt;%! ... %&gt;</code></div>
        <p style="font-size:13px; color:#475569;">
            Declares member variables and methods that become part of the translated Servlet class (outside the <code>_jspService()</code> method).
        </p>
        <pre>&lt;%!
    private int pageVisitCounter = 0;

    public String formatWelcomeMessage(String chefName) {
        return "Namaste Chef " + chefName + "! Welcome to Smart Rasoi.";
    }
%!&gt;</pre>

        <%!
            // Unit 7: JSP Declaration
            private int pageVisitCounter = 0;

            public String formatWelcomeMessage(String chefName) {
                return "Namaste Chef " + chefName + "! Welcome to Smart Rasoi.";
            }
        %>

        <div class="live-output">
            Declaration Result: Method <code>formatWelcomeMessage("Ananya")</code> was compiled into the Servlet class.
        </div>
    </div>

    <!-- ================================================================= -->
    <!-- 2. JSP EXPRESSION (<%= ... %>)                                    -->
    <!-- ================================================================= -->
    <div class="code-card">
        <div class="code-title">2. JSP Expression Tag: <code>&lt;%= ... %&gt;</code></div>
        <p style="font-size:13px; color:#475569;">
            Evaluates a Java expression, converts the result to a String, and writes it directly to the response output stream without needing a semicolon.
        </p>
        <pre>&lt;%= formatWelcomeMessage("Ananya") %&gt;
&lt;%= ++pageVisitCounter %&gt;</pre>

        <div class="live-output">
            Evaluated Expression Output 1: <strong><%= formatWelcomeMessage("Ananya") %></strong><br>
            Evaluated Expression Output 2: Page Hits counter = <strong><%= ++pageVisitCounter %></strong>
        </div>
    </div>

    <!-- ================================================================= -->
    <!-- 3. JSP SCRIPTLET (<% ... %>)                                      -->
    <!-- ================================================================= -->
    <div class="code-card">
        <div class="code-title">3. JSP Scriptlet Tag: <code>&lt;% ... %&gt;</code></div>
        <p style="font-size:13px; color:#475569;">
            Inserts Java statements directly into the generated Servlet's <code>_jspService()</code> method body.
        </p>
        <pre>&lt;%
    String[] pantryEssentials = { "Basmati Rice (5kg)", "Toor Dal (2kg)", "Turmeric Powder (250g)", "Pure Cow Ghee (1L)" };
    for (int i = 0; i &lt; pantryEssentials.length; i++) {
%&gt;
    &lt;li&gt;&lt;%= (i + 1) %&gt;. &lt;%= pantryEssentials[i] %&gt;&lt;/li&gt;
&lt;%
    }
%&gt;</pre>

        <div class="live-output">
            Scriptlet Loop Output:
            <ul>
                <%
                    // Unit 7: JSP Scriptlet
                    String[] pantryEssentials = { "Basmati Rice (5kg)", "Toor Dal (2kg)", "Turmeric Powder (250g)", "Pure Cow Ghee (1L)" };
                    for (int i = 0; i < pantryEssentials.length; i++) {
                %>
                    <li><%= (i + 1) %>. <%= pantryEssentials[i] %></li>
                <%
                    }
                %>
            </ul>
        </div>
    </div>

    <a href="${pageContext.request.contextPath}/index.jsp" class="btn-back">← Back to Academic Portal</a>
</div>
</body>
</html>
