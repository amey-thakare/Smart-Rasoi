# SMART RASOI — JAVA ACADEMIC SOURCE CODE LAYER
## University Syllabus Demonstration Modules (Units 1 through 7)

Welcome to the **Smart Rasoi Java Academic Layer**, an independent academic codebase developed to demonstrate university syllabus topics in Java programming while the primary Smart Rasoi application continues to operate on its modern MERN stack.

---

## 1. Quick Navigation & Important Documents

- **[SYLLABUS_MAPPING.md](file:///Users/umangkumar/java_project/smart-rasoi-java/SYLLABUS_MAPPING.md)** — Complete 1-to-1 traceability table mapping every topic in Units 1–7 to concrete classes and methods.
- **[VIVA_GUIDE.md](file:///Users/umangkumar/java_project/smart-rasoi-java/VIVA_GUIDE.md)** — Comprehensive viva voce defense guide with 22+ questions and high-scoring model answers.
- **[PROJECT_ARCHITECTURE.md](file:///Users/umangkumar/java_project/smart-rasoi-java/PROJECT_ARCHITECTURE.md)** — Detailed architecture document detailing the strict isolation between the MERN website and this Java layer.

---

## 2. Directory Structure

```
smart-rasoi-java/
├── core/                                 # Units 1-4: Pure Standard JDK (Zero Dependencies)
│   └── src/com/smartrasoi/
│       ├── model/                        # Domain entities: KitchenItem, Ingredient, Recipe, User, etc.
│       ├── exception/                    # Custom checked & unchecked exception classes
│       ├── util/                         # Interfaces, Bounded Generics, Custom Annotations, UnitConverter
│       ├── service/                      # Business logic: Collections, Comparators, Lambdas, Streams
│       ├── threading/                    # Threads, Runnables, Wait/Notify Queue, Safe Deadlock Demo
│       ├── serialization/                # Java I/O Character CSV Streams & Binary Object Streams
│       └── CoreSyllabusRunner.java       # Standalone CLI runner executing Units 1-4 demonstrations
│
├── database/                             # Unit 5: JDBC Persistence Layer
│   └── src/com/smartrasoi/db/
│       ├── DatabaseConnection.java       # SQLite JDBC connection manager
│       ├── schema.sql                    # SQL DDL table creation statements
│       ├── DataSeeder.java               # Automatic database seeder for academic records
│       ├── IngredientJdbcRepository.java # PreparedStatement CRUD & atomic transaction management
│       ├── UserJdbcRepository.java       # Salted SHA-256 user registration & authentication
│       └── DatabaseSyllabusRunner.java   # Standalone CLI runner executing Unit 5 JDBC operations
│
├── desktop/                              # Unit 5 & Req 12: JavaFX Desktop GUI & Interactive Screen
│   └── src/com/smartrasoi/gui/
│       ├── SmartRasoiJavaFXApp.java      # Complete desktop app with MenuBar, TableView, forms, tabs
│       └── SyllabusDemoScreen.java       # Interactive 7-button syllabus concept execution screen
│
├── web/                                  # Units 6 & 7: Servlets, JSP, JavaBeans & MVC Web Module
│   ├── src/com/smartrasoi/web/
│   │   ├── BaseServlet.java              # Abstract base controller with DB bootstrapping
│   │   ├── LoginServlet.java             # doGet/doPost authentication with session tracking
│   │   ├── RegisterServlet.java          # User registration with salted hashing
│   │   ├── InventoryServlet.java         # Protected MVC controller forwarding JavaBeans to JSP
│   │   ├── LogoutServlet.java            # Session invalidation controller
│   │   ├── IngredientBean.java           # JavaBean complying with JavaBean specification
│   │   ├── RecipeBean.java               # JavaBean representing recipes in JSP views
│   │   └── CurrencyFormatTag.java        # Custom JSP tag handler
│   └── WebContent/
│       ├── WEB-INF/
│       │   ├── web.xml                   # Deployment descriptor with servlet mappings & session config
│       │   └── tlds/rasoi-tags.tld       # Tag Library Descriptor for custom JSP tags
│       ├── index.jsp                     # Academic portal landing page
│       ├── login.jsp                     # Login form
│       ├── register.jsp                  # Registration form
│       ├── inventory.jsp                 # Protected MVC view with <jsp:useBean> and EL
│       └── scriptlet_demo.jsp            # Educational page demonstrating legacy Declarations, Expressions & Scriptlets
│
├── scripts/
│   ├── compile.sh                        # Automated bash compilation script
│   └── run_core_demo.sh                  # Execution script for Core Syllabus Runner
│
├── SYLLABUS_MAPPING.md
├── VIVA_GUIDE.md
├── PROJECT_ARCHITECTURE.md
└── README.md
```

---

## 3. How to Compile and Run the Java Modules

### Prerequisites
- **JDK:** OpenJDK 17 LTS (or Java 11/21).
  - macOS (Homebrew): `brew install openjdk@17`
  - Linux: `sudo apt install openjdk-17-jdk`
  - Windows: Download OpenJDK 17 installer from adoptium.net
- **Optional for Desktop GUI:** JavaFX SDK 17+ (e.g. from gluonhq.com)
- **Optional for Web Module:** Apache Tomcat 9 or 10.1 (Servlet container)

---

### Step A: Compiling the Modules

Run the automated compilation script from the repository root:
```bash
bash smart-rasoi-java/scripts/compile.sh
```
This script compiles:
1. **Core Module:** Uses standard `javac` with zero external dependencies.
2. **Database Module:** Links `sqlite-jdbc.jar` if present in `lib/`.
3. **Desktop Module:** Compiles JavaFX components if `JAVAFX_HOME` is set.
4. **Web Module:** Compiles Servlets if `servlet-api.jar` or `CATALINA_HOME` is present.

---

### Step B: Running the Core Syllabus Demonstrations (Units 1 - 4)

To run the complete interactive CLI syllabus demo (Fundamentals, OOP, Exceptions, Threads, Files, Serialization, Collections, Generics, and Safe Deadlock):
```bash
bash smart-rasoi-java/scripts/run_core_demo.sh
```
Or directly using `java`:
```bash
java -cp smart-rasoi-java/bin com.smartrasoi.CoreSyllabusRunner
```

---

### Step C: Running the JDBC Database Module (Unit 5)

Download the standard SQLite JDBC jar (e.g., `sqlite-jdbc-3.45.1.0.jar`) into `smart-rasoi-java/lib/`:
```bash
java -cp "smart-rasoi-java/bin:smart-rasoi-java/lib/sqlite-jdbc.jar" com.smartrasoi.db.DatabaseSyllabusRunner
```
This executes:
- Table creation from `schema.sql`
- Data seeding via `DataSeeder.java`
- SQL INSERT, SELECT, UPDATE, DELETE with `PreparedStatement`
- Batch transaction management with rollback on error
- Salted SHA-256 user registration and timing-safe authentication check

---

### Step D: Running the JavaFX Desktop GUI & Interactive Screen (Unit 5 & Req 12)

If JavaFX SDK is installed:
```bash
export JAVAFX_HOME=/path/to/javafx-sdk-17
java --module-path $JAVAFX_HOME/lib --add-modules javafx.controls,javafx.fxml \
     -cp "smart-rasoi-java/bin:smart-rasoi-java/lib/sqlite-jdbc.jar" \
     com.smartrasoi.gui.SmartRasoiJavaFXApp
```

To run the **Syllabus Demonstration Screen** directly:
```bash
java --module-path $JAVAFX_HOME/lib --add-modules javafx.controls,javafx.fxml \
     -cp "smart-rasoi-java/bin" \
     com.smartrasoi.gui.SyllabusDemoScreen
```

---

### Step E: Running the Servlets & JSP Web Module (Units 6 & 7)

Package `WebContent` into a `.war` file or deploy directly to Apache Tomcat:
1. Copy `smart-rasoi-java/web/WebContent/` to your Tomcat `webapps/smart-rasoi/` directory.
2. Start Tomcat (`catalina.sh run`).
3. Open browser at: `http://localhost:8080/smart-rasoi/`
4. Access:
   - Login: `http://localhost:8080/smart-rasoi/login` (Default credentials: `student@smartrasoi.ac.in` / `RasoiPass2026!`)
   - Inventory: `http://localhost:8080/smart-rasoi/inventory`
   - Educational Scriptlet Demo: `http://localhost:8080/smart-rasoi/scriptlet_demo.jsp`

---

## 4. Main Smart Rasoi Website Execution

As established in the project guidelines:
**The existing MERN application remains the only application required to run the main website.**

Start the main website as usual:
```bash
npm run dev
```
- Frontend UI: `http://localhost:5173`
- Backend API: `http://localhost:5001`
- SQLite/Prisma Database: `server/prisma/dev.db`
