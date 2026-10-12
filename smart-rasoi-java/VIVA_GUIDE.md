# SMART RASOI — FACULTY VIVA VOCE PREPARATION GUIDE
## High-Yield Questions, Conceptual Explanations & Model Answers for University Assessment

This guide is designed to prepare students for academic viva voce examinations, project defense, and lab assessments covering Units 1 through 7 of the university Java syllabus.

---

## 1. Project Architecture Defense

### Q1: What is the relationship between the running MERN website and this Java codebase?
**Answer:**
Smart Rasoi is architected with a clear separation of concerns:
- **The Main Website Application** is built with React, Vite, Node.js, Express, SQLite/Prisma, and the Google Gemini API. It is launched solely via `npm run dev` and provides the live production user experience.
- **The Java Academic Codebase** (`smart-rasoi-java/`) is a dedicated educational layer sharing the same kitchen domain model (Ingredients, Recipes, Meal Plans, Shopping Lists) to demonstrate university syllabus topics: Object-Oriented Design, Concurrency, JDBC, JavaFX desktop GUIs, and Enterprise Servlets/JSP.
- **Key Architectural Rule:** There are zero runtime dependencies between the two applications. The MERN application does not call Java, and Java does not replace or proxy the MERN web application.

---

## 2. Unit 1: Java Fundamentals & Architecture

### Q2: Explain the roles of the JVM, JRE, and JDK. What makes Java platform-independent?
**Answer:**
- **JDK (Java Development Kit):** Contains development tools (`javac` compiler, `jar` tool, debugger) and the JRE.
- **JRE (Java Runtime Environment):** Contains the JVM and standard core runtime libraries necessary to execute compiled programs.
- **JVM (Java Virtual Machine):** An abstract computing machine that loads, verifies, and executes platform-independent **bytecode** (`.class` files).
- **Platform Independence:** Java achieves "Write Once, Run Anywhere" (WORA) because the compiler produces intermediate bytecode rather than machine-specific assembly. Any operating system with a compatible JVM can execute this bytecode.

### Q3: What is the difference between Widening and Narrowing type casting?
**Answer:**
- **Widening (Implicit):** Converting a smaller primitive data type to a larger type (e.g., `int` to `double`). It happens automatically without loss of precision.
- **Narrowing (Explicit):** Converting a larger type to a smaller type (e.g., `double` to `int`). It requires an explicit cast operator `(int) value` because data loss or fractional truncation can occur.
- *Demonstration in Smart Rasoi:* `UnitConverter.convertQuantityToPantryGramsRounded()` explicitly casts computed double grams to an integer pantry count.

### Q4: Explain operator precedence and associativity with an example from the project.
**Answer:**
Operator precedence dictates the order in which operators are evaluated. Multiplicative operators (`*`, `/`) have higher precedence than additive operators (`+`, `-`). Associativity determines evaluation order for operators of equal precedence (typically left-to-right).
- *In Smart Rasoi:* In `NutritionInfo.computeEstimatedCaloriesFromMacros()`:
  `calories = (protein * 4.0) + (carbs * 4.0) + (fat * 9.0);`
  The multiplications occur first, followed by left-to-right addition.

---

## 3. Unit 2: Object-Oriented Programming

### Q5: What is the difference between an Abstract Class and an Interface? When would you use each?
**Answer:**
| Feature | Abstract Class (`KitchenItem`) | Interface (`CostCalculable`) |
| :--- | :--- | :--- |
| **Inheritance** | Single inheritance (`extends`) | Multiple interfaces allowed (`implements`) |
| **State** | Can declare instance variables and state | Only `public static final` constants |
| **Constructors** | Can have constructors (for subclass state) | Cannot have constructors |
| **Default Methods** | Concrete methods with any access modifier | Java 8 `default` and `static` methods only |
| **Purpose** | Defines core identity and shared base state | Defines a behavioral contract across unrelated types |

### Q6: How does Method Overloading differ from Method Overriding?
**Answer:**
- **Method Overloading (Compile-Time Polymorphism):** Multiple methods in the same class share the same name but have different parameter lists (type, count, or order). Return type alone is insufficient.
  - *Example in Smart Rasoi:* `Ingredient.addStock(double)`, `addStock(double, String)`, `addStock(double, double)`.
- **Method Overriding (Runtime Polymorphism / Dynamic Dispatch):** A subclass provides a specific implementation of a method already declared in its superclass, using the exact same signature and return type.
  - *Example in Smart Rasoi:* `PerishableIngredient.getStorageRequirement()` overrides `KitchenItem.getStorageRequirement()`.

### Q7: Why is the `finalize()` method deprecated in modern Java?
**Answer:**
`finalize()` (deprecated since Java 9 and marked for removal) was intended to allow cleanup before garbage collection. However:
1. The JVM provides **no guarantee** when or if `finalize()` will ever run.
2. It causes significant performance penalties, memory leaks, and object resurrection bugs.
3. **Modern Best Practice:** Deterministic resource cleanup must always use `AutoCloseable` with **try-with-resources** statements.

---

## 4. Unit 3: Exception Handling and Concurrency

### Q8: What is the difference between Checked and Unchecked Exceptions?
**Answer:**
- **Checked Exceptions:** Subclasses of `java.lang.Exception` (excluding `RuntimeException`). The Java compiler strictly enforces that callers must either catch them with `try-catch` or declare them in their method signature with `throws`. Used for recoverable business errors.
  - *In Smart Rasoi:* `InsufficientInventoryException`, `InvalidQuantityException`, `KitchenException`.
- **Unchecked Exceptions:** Subclasses of `java.lang.RuntimeException` or `java.lang.Error`. They represent programming bugs or unrecoverable conditions (e.g., `NullPointerException`, `IllegalArgumentException`). The compiler does not enforce `try-catch` or `throws`.
  - *In Smart Rasoi:* `KitchenRuntimeException`.

### Q9: What are the two ways to create a thread in Java, and which is preferred?
**Answer:**
1. **Extending `Thread`:** Subclassing `java.lang.Thread` and overriding `run()`.
   - *Example:* `ReportGeneratorThread.java`.
2. **Implementing `Runnable`:** Implementing `java.lang.Runnable` and passing an instance to `new Thread(runnable)`.
   - *Example:* `InventorySyncRunnable.java`.
- **Preferred Approach:** Implementing `Runnable` is preferred because Java does not support multiple class inheritance. By implementing `Runnable`, the class remains free to extend another business class, separates task logic from thread execution, and is compatible with `ExecutorService` thread pools.

### Q10: How do `wait()` and `notifyAll()` coordinate threads?
**Answer:**
- `wait()`, `notify()`, and `notifyAll()` are methods of `java.lang.Object` used for inter-thread communication.
- They must be called from within a **synchronized block or method**, meaning the calling thread must own the monitor lock.
- Calling `wait()` causes the current thread to **release the monitor lock** and enter the WAITING state until another thread invokes `notify()` or `notifyAll()` on that same object.
- *Best Practice:* Always invoke `wait()` inside a `while` loop (not an `if` statement) to guard against **spurious wakeups**.
- *In Smart Rasoi:* Implemented in `SharedInventoryQueue.java` for producer-consumer replenishment.

### Q11: What are the Coffman conditions for Deadlock, and how does your project demonstrate safe deadlock?
**Answer:**
Deadlock occurs when four conditions hold simultaneously:
1. **Mutual Exclusion:** Resources cannot be shared.
2. **Hold and Wait:** A thread holds at least one resource and requests another.
3. **No Preemption:** Resources cannot be forcibly seized.
4. **Circular Wait:** Thread A waits for a resource held by Thread B, which waits for a resource held by Thread A.
- *In Smart Rasoi:* `SafeDeadlockDemo.java` creates a controlled circular wait scenario using `ReentrantLock`. Crucially, to prevent freezing the application or JVM during a demo, each thread uses timed acquisition (`tryLock(timeout)`) and clean fallback logic, guaranteeing safe termination within hundreds of milliseconds.

---

## 5. Unit 4: Files, Streams, Serialization & Collections

### Q12: Compare Byte Streams with Character Streams.
**Answer:**
- **Byte Streams:** Inherit from `InputStream` / `OutputStream`. Read and write raw binary data in 8-bit bytes (useful for images, compiled class files, and serialized object graphs like `AppStateSerializer.java`).
- **Character Streams:** Inherit from `Reader` / `Writer`. Read and write Unicode characters in 16-bit units with character encoding handling (useful for text and CSV files like `CsvExporter.java` using `BufferedReader` and `BufferedWriter`).

### Q13: What is Object Serialization, and what is the role of `serialVersionUID`?
**Answer:**
- **Serialization:** Converting an in-memory object graph into a sequence of bytes via `ObjectOutputStream` so it can be persisted to disk or transmitted across a network. Classes must implement `java.io.Serializable`.
- **`serialVersionUID`:** A unique 64-bit hash identifying the class version. During deserialization, the JVM compares the stream's UID with the loaded class's UID. If they mismatch (e.g., class fields changed), an `InvalidClassException` is thrown, preventing memory corruption.

### Q14: How do `Comparable` and `Comparator` differ?
**Answer:**
- **`Comparable<T>`:** Implemented by the domain class itself (`class Ingredient implements Comparable<Ingredient>`). Defines **natural ordering** via `compareTo(T other)`. Takes a single argument.
- **`Comparator<T>`:** A separate class or lambda defining **custom or alternative sorting orders** via `compare(T o1, T o2)`. Takes two arguments.
- *In Smart Rasoi:* Natural ordering sorts alphabetically by name; `InventoryService` provides custom Comparators to sort by quantity descending, unit price, and expiry date.

---

## 6. Unit 5: JavaFX Desktop GUI & JDBC Persistence

### Q15: Explain the JavaFX Stage, Scene, and Scene Graph hierarchy.
**Answer:**
- **Stage:** The top-level native OS window container (provided by the JavaFX runtime to `start(Stage primaryStage)`).
- **Scene:** The visual container for all content within a stage (`new Scene(root, width, height)`). A Stage can switch between different Scenes.
- **Scene Graph:** A hierarchical tree of `Node` elements (layouts like `BorderPane`, `VBox`, and UI controls like `TableView`, `Button`, `TextField`).

### Q16: Why should `PreparedStatement` be used instead of standard `Statement`?
**Answer:**
1. **Prevents SQL Injection:** Parameter placeholders (`?`) ensure user input is treated strictly as literal data, never as executable SQL commands.
2. **Pre-compilation & Performance:** The database parses and compiles the query plan once; subsequent executions with different parameters reuse the compiled plan.
3. **Type Safety:** Typed setters (`setString`, `setDouble`, `setInt`) eliminate tedious and error-prone string quoting.

### Q17: How do transactions work in JDBC?
**Answer:**
By default, JDBC operates in auto-commit mode (`conn.getAutoCommit() == true`), committing every individual SQL statement immediately.
To execute an atomic transaction:
1. Disable auto-commit: `conn.setAutoCommit(false);`
2. Execute multiple batch statements.
3. Commit if all succeed: `conn.commit();`
4. In a `catch` block on failure, rollback: `conn.rollback();`
5. Always reset `conn.setAutoCommit(true)` and close resources in `finally`.
- *In Smart Rasoi:* Demonstrated in `IngredientJdbcRepository.updateBatchInTransaction()`.

---

## 7. Units 6 & 7: Servlets, JSP, JavaBeans & MVC

### Q18: Describe the Servlet Lifecycle.
**Answer:**
1. **Loading and Instantiation:** The Servlet container loads the servlet class and instantiates it using its no-arg constructor.
2. **Initialization (`init`):** Container calls `init(ServletConfig)`. Executed **once** in the servlet's life to allocate resources (in Smart Rasoi, `BaseServlet.init()` bootstraps database connections).
3. **Request Handling (`service`):** For each incoming client request, a separate worker thread executes `service()`, which delegates to `doGet()`, `doPost()`, etc.
4. **Destruction (`destroy`):** Container calls `destroy()` before unloading the servlet to release memory and resources.

### Q19: Explain the difference between `sendRedirect()` and `RequestDispatcher.forward()`.
**Answer:**
- **`forward()` (Server-Side):** The request and response objects are forwarded internally within the container to another servlet or JSP. The browser is unaware of the transfer; the URL in the address bar **does not change**. Request attributes are preserved.
- **`sendRedirect()` (Client-Side):** The server sends an HTTP 302 response instructing the browser to issue a completely new GET request to a new URL. The URL in the address bar **changes**, and previous request attributes are discarded.

### Q20: What are JavaBeans, and what are their four mandatory conventions?
**Answer:**
JavaBeans are reusable software components that follow four strict conventions:
1. Must implement `java.io.Serializable`.
2. Must have a `public` zero-argument (default) constructor.
3. Properties must be `private` (encapsulation).
4. Properties must be accessible through standard `public` getter (`getProperty()`) and setter (`setProperty(...)`) methods.
- *In Smart Rasoi:* `IngredientBean` and `RecipeBean` represent domain data transferred from Servlet controllers to JSP views.

### Q21: Why are scriptlets discouraged in enterprise web development?
**Answer:**
While legacy syllabus topics mandate understanding Declarations (`<%! %>`), Expressions (`<%= %>`), and Scriptlets (`<% %>`), modern web development discourages scriptlets because:
1. They mix Java business logic with HTML presentation, violating MVC separation.
2. They are difficult to test, maintain, debug, and reuse.
3. They introduce security risks (cross-site scripting / XSS).
- *Solution in Smart Rasoi:* `inventory.jsp` uses Servlet controllers, JavaBeans, Expression Language (`${item.name}`), and custom JSP tags (`<rasoi:currency>`), while `scriptlet_demo.jsp` isolates scriptlets strictly as an educational reference.

---

## 8. Authentication & Cryptographic Security

### Q22: How does the Java academic layer implement password security?
**Answer:**
- In accordance with academic guidelines, passwords are never stored or logged in plaintext.
- `User.java` generates a 16-byte cryptographically secure random salt using `java.security.SecureRandom`.
- It hashes the raw password using standard Java `java.security.MessageDigest` (SHA-256).
- Verification uses constant-time byte comparison (`MessageDigest.isEqual`) to protect against timing attacks.
