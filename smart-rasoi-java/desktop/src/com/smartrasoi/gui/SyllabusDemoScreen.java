package com.smartrasoi.gui;

import com.smartrasoi.db.DatabaseConnection;
import com.smartrasoi.db.IngredientJdbcRepository;
import com.smartrasoi.exception.InsufficientInventoryException;
import com.smartrasoi.model.Category;
import com.smartrasoi.model.Ingredient;
import com.smartrasoi.model.KitchenItem;
import com.smartrasoi.model.PerishableIngredient;
import com.smartrasoi.serialization.AppStateSerializer;
import com.smartrasoi.serialization.CsvExporter;
import com.smartrasoi.service.InventoryService;
import com.smartrasoi.threading.ReportGeneratorThread;
import com.smartrasoi.threading.SafeDeadlockDemo;
import com.smartrasoi.util.CostCalculable;
import com.smartrasoi.util.GenericRepository;
import javafx.application.Application;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.stage.Stage;

import java.io.File;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Requirement 12: Java Syllabus Interactive Demonstration Screen.
 *
 * Demonstrates:
 * - Interactive JavaFX UI with 7 distinct syllabus action buttons
 * - Executes GENUINE Java code on click (no mocked or fake simulations)
 * - Displays visible results, concept explanations, and source-file paths
 * - Stage, Scene, Button, TextArea, ScrollPane, VBox, HBox, Label, styling
 */
public class SyllabusDemoScreen extends Application {

    private TextArea outputArea;
    private Label conceptTitleLabel;
    private Label sourceFilePathLabel;
    private TextArea conceptExplanationArea;

    @Override
    public void start(Stage primaryStage) {
        primaryStage.setTitle("Smart Rasoi — Java Syllabus Demonstration Dashboard");

        Pane root = createDemoPanel();
        Scene scene = new Scene(root, 980, 720);

        primaryStage.setScene(scene);
        primaryStage.show();
    }

    public Pane createDemoPanel() {
        BorderPane root = new BorderPane();
        root.setPadding(new Insets(15));
        root.setStyle("-fx-background-color: #f8fafc;");

        // Header
        VBox headerBox = new VBox(6);
        headerBox.setPadding(new Insets(0, 0, 15, 0));
        Label headerTitle = new Label("Smart Rasoi — University Syllabus Interactive Demonstration Layer");
        headerTitle.setStyle("-fx-font-size: 20px; -fx-font-weight: bold; -fx-text-fill: #1e293b;");
        Label headerSub = new Label("Click any concept button below to execute genuine Java code and view real runtime output.");
        headerSub.setStyle("-fx-font-size: 13px; -fx-text-fill: #64748b;");
        headerBox.getChildren().addAll(headerTitle, headerSub);
        root.setTop(headerBox);

        // Center Split View
        VBox mainContent = new VBox(12);

        // Button toolbar
        FlowPane buttonBar = new FlowPane();
        buttonBar.setHgap(10);
        buttonBar.setVgap(10);
        buttonBar.setAlignment(Pos.CENTER_LEFT);

        Button btnOop = createStyledButton("1. Inheritance & Polymorphism", "#2563eb");
        Button btnExceptions = createStyledButton("2. Exception Handling", "#dc2626");
        Button btnCollections = createStyledButton("3. Collections & Sorting", "#059669");
        Button btnFiles = createStyledButton("4. File Handling & CSV", "#d97706");
        Button btnSerialization = createStyledButton("5. Object Serialization", "#7c3aed");
        Button btnJdbc = createStyledButton("6. JDBC Database CRUD", "#0891b2");
        Button btnConcurrency = createStyledButton("7. Threads & Concurrency", "#4f46e5");

        buttonBar.getChildren().addAll(btnOop, btnExceptions, btnCollections, btnFiles, btnSerialization, btnJdbc, btnConcurrency);

        // Concept Details Card
        VBox conceptCard = new VBox(6);
        conceptCard.setPadding(new Insets(12));
        conceptCard.setStyle("-fx-background-color: #ffffff; -fx-border-color: #e2e8f0; -fx-border-radius: 8px; -fx-background-radius: 8px;");

        conceptTitleLabel = new Label("Concept: Select a topic above to begin demonstration");
        conceptTitleLabel.setStyle("-fx-font-size: 15px; -fx-font-weight: bold; -fx-text-fill: #0f172a;");

        sourceFilePathLabel = new Label("Source File: [Pending Selection]");
        sourceFilePathLabel.setStyle("-fx-font-size: 12px; -fx-font-family: monospace; -fx-text-fill: #2563eb;");

        conceptExplanationArea = new TextArea("This interactive panel executes actual Java code from the Smart Rasoi academic codebase.\nClick any button above to inspect syllabus demonstrations.");
        conceptExplanationArea.setPrefRowCount(3);
        conceptExplanationArea.setEditable(false);
        conceptExplanationArea.setWrapText(true);
        conceptExplanationArea.setStyle("-fx-font-size: 12px; -fx-control-inner-background: #f1f5f9;");

        conceptCard.getChildren().addAll(conceptTitleLabel, sourceFilePathLabel, conceptExplanationArea);

        // Output Console Area
        VBox outputBox = new VBox(6);
        Label outputHeader = new Label("Runtime Execution Console Output:");
        outputHeader.setStyle("-fx-font-size: 13px; -fx-font-weight: bold; -fx-text-fill: #334155;");

        outputArea = new TextArea();
        outputArea.setEditable(false);
        outputArea.setWrapText(false);
        outputArea.setPrefRowCount(16);
        outputArea.setStyle("-fx-font-family: 'Courier New', monospace; -fx-font-size: 12px; -fx-control-inner-background: #0f172a; -fx-text-fill: #38bdf8;");

        outputBox.getChildren().addAll(outputHeader, outputArea);

        mainContent.getChildren().addAll(buttonBar, conceptCard, outputBox);
        root.setCenter(mainContent);

        // ==========================================
        // ACTION LISTENERS (GENUINE JAVA EXECUTION)
        // ==========================================

        btnOop.setOnAction(e -> executeOopDemonstration());
        btnExceptions.setOnAction(e -> executeExceptionDemonstration());
        btnCollections.setOnAction(e -> executeCollectionsDemonstration());
        btnFiles.setOnAction(e -> executeFilesDemonstration());
        btnSerialization.setOnAction(e -> executeSerializationDemonstration());
        btnJdbc.setOnAction(e -> executeJdbcDemonstration());
        btnConcurrency.setOnAction(e -> executeConcurrencyDemonstration());

        return root;
    }

    private Button createStyledButton(String text, String colorHex) {
        Button btn = new Button(text);
        btn.setStyle(String.format(
                "-fx-background-color: %s; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 12px; " +
                "-fx-padding: 8 14 8 14; -fx-background-radius: 6px; -fx-cursor: hand;", colorHex));
        return btn;
    }

    // 1. INHERITANCE & POLYMORPHISM
    private void executeOopDemonstration() {
        conceptTitleLabel.setText("Concept: Unit 2 — Abstract Classes, Multilevel Inheritance & Dynamic Method Dispatch");
        sourceFilePathLabel.setText("Source Files: smart-rasoi-java/core/src/com/smartrasoi/model/KitchenItem.java & PerishableIngredient.java");
        conceptExplanationArea.setText("Demonstrates abstract class KitchenItem, multilevel inheritance (KitchenItem -> Ingredient -> PerishableIngredient), " +
                "and runtime polymorphism where calling getStorageRequirement() on base references dispatches dynamically to derived class implementations.");

        StringBuilder sb = new StringBuilder();
        sb.append(">>> EXECUTING INHERITANCE & POLYMORPHISM DEMONSTRATION...\n\n");

        KitchenItem dryItem = new Ingredient("Basmati Rice", Category.GRAIN, 5.0, "kg", 95.0, 1.0);
        KitchenItem coldItem = new PerishableIngredient("Amul Paneer", Category.DAIRY, 0.4, "kg", 320.0,
                LocalDate.now().plusDays(4), 4.0);

        sb.append("Base Reference 1 (KitchenItem -> Ingredient): ").append(dryItem.getName()).append("\n");
        sb.append("  Polymorphic Storage Call: ").append(dryItem.getStorageRequirement()).append("\n\n");

        sb.append("Base Reference 2 (KitchenItem -> PerishableIngredient): ").append(coldItem.getName()).append("\n");
        sb.append("  Polymorphic Storage Call: ").append(coldItem.getStorageRequirement()).append("\n\n");

        CostCalculable costItem = (CostCalculable) dryItem;
        sb.append("Interface CostCalculable Call: ").append(CostCalculable.formatCurrency(costItem.calculateTotalCost())).append("\n");
        sb.append("Is Budget ₹400 exceeded? ").append(costItem.isCostExceeded(400.0)).append("\n");

        outputArea.setText(sb.toString());
    }

    // 2. EXCEPTION HANDLING
    private void executeExceptionDemonstration() {
        conceptTitleLabel.setText("Concept: Unit 3 — Checked vs Unchecked Exceptions, try-catch-finally & throw/throws");
        sourceFilePathLabel.setText("Source Files: smart-rasoi-java/core/src/com/smartrasoi/exception/InsufficientInventoryException.java");
        conceptExplanationArea.setText("Demonstrates custom user-defined checked exceptions inheriting from java.lang.Exception. " +
                "The method deductStockForCooking declares throws, and caller catches InsufficientInventoryException to handle shortfalls safely.");

        StringBuilder sb = new StringBuilder();
        sb.append(">>> EXECUTING USER-DEFINED EXCEPTION HANDLING DEMONSTRATION...\n\n");

        InventoryService service = new InventoryService();
        service.addIngredient(new Ingredient("Full Cream Milk", Category.DAIRY, 1.0, "l", 66.0, 0.5));

        try {
            sb.append("Attempting to deduct 3.5 liters of Milk from pantry stock (available: 1.0 l)...\n");
            service.deductStockForCooking("Full Cream Milk", 3.5, "l");
            sb.append("ERROR: Deduction should have failed!\n");
        } catch (InsufficientInventoryException e) {
            sb.append("[SUCCESSFULLY CAUGHT CHECKED EXCEPTION]\n");
            sb.append("  Exception Class: ").append(e.getClass().getName()).append("\n");
            sb.append("  Error Code: ").append(e.getErrorCode()).append("\n");
            sb.append("  Message: ").append(e.getMessage()).append("\n");
            sb.append("  Required: ").append(e.getRequiredQuantity()).append(" l | Available: ").append(e.getAvailableQuantity()).append(" l\n");
            sb.append("  Calculated Shortfall: ").append(e.getShortfall()).append(" l\n");
        } catch (Exception e) {
            sb.append("Caught general exception: ").append(e.getMessage()).append("\n");
        } finally {
            sb.append("\n[FINALLY BLOCK GUARANTEED EXECUTION] Executed resource cleanup / audit logger.");
        }

        outputArea.setText(sb.toString());
    }

    // 3. COLLECTIONS & SORTING
    private void executeCollectionsDemonstration() {
        conceptTitleLabel.setText("Concept: Unit 4 — Collections Framework (List, Map, Set), Comparators & Lambdas");
        sourceFilePathLabel.setText("Source Files: smart-rasoi-java/core/src/com/smartrasoi/service/InventoryService.java");
        conceptExplanationArea.setText("Demonstrates Map<String, Ingredient> for O(1) lookups, Set<String> for extracting distinct names, " +
                "custom Comparator sorting (descending quantity), and Java 8 lambda streams.");

        StringBuilder sb = new StringBuilder();
        sb.append(">>> EXECUTING COLLECTIONS & COMPARATORS DEMONSTRATION...\n\n");

        InventoryService service = new InventoryService();
        service.addIngredient(new Ingredient("Basmati Rice", Category.GRAIN, 4.0, "kg", 95.0, 1.0));
        service.addIngredient(new Ingredient("Moong Dal", Category.PULSE, 1.5, "kg", 130.0, 0.5));
        service.addIngredient(new Ingredient("Turmeric Powder", Category.SPICE, 0.2, "kg", 320.0, 0.1));
        service.addIngredient(new Ingredient("Ghee", Category.DAIRY, 0.8, "l", 650.0, 0.2));

        sb.append("1. Set Collection (Unique ingredient names): ").append(service.getUniqueIngredientNames()).append("\n\n");

        sb.append("2. Custom Comparator Sort (Quantity Descending):\n");
        List<Ingredient> sorted = service.getIngredientsSortedByQuantityDesc();
        for (Ingredient i : sorted) {
            sb.append(String.format("   - %-18s : %.2f %s (₹%.2f/unit)\n", i.getName(), i.getQuantity(), i.getUnit(), i.getUnitPrice()));
        }

        GenericRepository<Ingredient> genericRepo = new GenericRepository<>();
        sorted.forEach(genericRepo::add);
        sb.append("\n3. Bounded Generics <T extends KitchenItem & CostCalculable> Total Value:\n");
        sb.append(String.format("   Total Pantry Valuation: ₹%.2f\n", genericRepo.calculateTotalRepositoryCost()));

        outputArea.setText(sb.toString());
    }

    // 4. FILE HANDLING & CSV
    private void executeFilesDemonstration() {
        conceptTitleLabel.setText("Concept: Unit 4 — Java I/O Streams, Character Streams (BufferedReader/Writer)");
        sourceFilePathLabel.setText("Source Files: smart-rasoi-java/core/src/com/smartrasoi/serialization/CsvExporter.java");
        conceptExplanationArea.setText("Demonstrates Java I/O streams using BufferedWriter and BufferedReader with try-with-resources. " +
                "Exports inventory to disk, parses delimited records, and imports back into domain objects.");

        StringBuilder sb = new StringBuilder();
        sb.append(">>> EXECUTING JAVA I/O STREAMS & CSV HANDLING...\n\n");

        File file = new File("scratch_javafx_demo.csv");
        CsvExporter exporter = new CsvExporter();
        List<Ingredient> sample = new ArrayList<>();
        sample.add(new Ingredient("ING-1", "Basmati Rice", Category.GRAIN, 5.0, "kg", 1.0, 95.0, LocalDate.now().plusMonths(6), "Pantry"));
        sample.add(new Ingredient("ING-2", "Pure Cow Ghee", Category.DAIRY, 1.0, "l", 0.2, 650.0, LocalDate.now().plusMonths(4), "Pantry"));

        try {
            exporter.exportInventoryToCsv(sample, file);
            sb.append("Successfully wrote CSV file using BufferedWriter: ").append(file.getAbsolutePath()).append("\n");
            sb.append("File size: ").append(file.length()).append(" bytes\n\n");

            List<Ingredient> reloaded = exporter.importInventoryFromCsv(file);
            sb.append("Successfully read CSV file using BufferedReader:\n");
            for (Ingredient item : reloaded) {
                sb.append("  - Loaded: ").append(item.getName()).append(" (").append(item.getQuantity()).append(" ").append(item.getUnit()).append(")\n");
            }
        } catch (Exception e) {
            sb.append("I/O Error: ").append(e.getMessage()).append("\n");
        } finally {
            if (file.exists()) file.delete();
            sb.append("\nCleaned up scratch file safely.");
        }

        outputArea.setText(sb.toString());
    }

    // 5. OBJECT SERIALIZATION
    private void executeSerializationDemonstration() {
        conceptTitleLabel.setText("Concept: Unit 4 — Object Serialization & Deserialization (ObjectOutputStream/InputStream)");
        sourceFilePathLabel.setText("Source Files: smart-rasoi-java/core/src/com/smartrasoi/serialization/AppStateSerializer.java");
        conceptExplanationArea.setText("Demonstrates byte streams and serializing complete object graphs to binary disk format. " +
                "Deserializes state bundle back into memory with class-type verification.");

        StringBuilder sb = new StringBuilder();
        sb.append(">>> EXECUTING OBJECT SERIALIZATION DEMONSTRATION...\n\n");

        File serFile = new File("scratch_javafx_demo.ser");
        AppStateSerializer serializer = new AppStateSerializer();

        List<Ingredient> items = new ArrayList<>();
        items.add(new Ingredient("Cumin Seeds (Jeera)", Category.SPICE, 0.25, "kg", 400.0, 0.05));
        items.add(new Ingredient("Turmeric Powder", Category.SPICE, 0.5, "kg", 300.0, 0.1));

        try {
            AppStateSerializer.KitchenStateBundle bundle = new AppStateSerializer.KitchenStateBundle(items, new ArrayList<>(), new ArrayList<>());
            serializer.serializeState(bundle, serFile);
            sb.append("State bundle serialized via ObjectOutputStream to: ").append(serFile.getName()).append("\n");
            sb.append("Binary payload size: ").append(serFile.length()).append(" bytes\n\n");

            AppStateSerializer.KitchenStateBundle restored = serializer.deserializeState(serFile);
            sb.append("State bundle deserialized via ObjectInputStream successfully:\n");
            sb.append("  Timestamp: ").append(restored.getTimestamp()).append("\n");
            sb.append("  Restored ingredients count: ").append(restored.getIngredients().size()).append("\n");
            for (Ingredient i : restored.getIngredients()) {
                sb.append("  - ").append(i.getName()).append(" (₹").append(i.getUnitPrice()).append(")\n");
            }
        } catch (Exception e) {
            sb.append("Serialization error: ").append(e.getMessage()).append("\n");
        } finally {
            if (serFile.exists()) serFile.delete();
            sb.append("\nCleaned up binary scratch file safely.");
        }

        outputArea.setText(sb.toString());
    }

    // 6. JDBC OPERATIONS
    private void executeJdbcDemonstration() {
        conceptTitleLabel.setText("Concept: Unit 5 — JDBC, PreparedStatement, ResultSet & SQLite Database");
        sourceFilePathLabel.setText("Source Files: smart-rasoi-java/database/src/com/smartrasoi/db/IngredientJdbcRepository.java");
        conceptExplanationArea.setText("Demonstrates establishing a JDBC connection, executing parameterized SQL INSERT, SELECT, UPDATE, DELETE " +
                "using PreparedStatement, and traversing ResultSet.");

        StringBuilder sb = new StringBuilder();
        sb.append(">>> EXECUTING JDBC SQLITE DEMONSTRATION...\n\n");

        try {
            DatabaseConnection db = DatabaseConnection.getInstance("jdbc:sqlite:smart-rasoi-java/smart_rasoi_academic.db");
            db.initializeDatabase();
            IngredientJdbcRepository repo = new IngredientJdbcRepository(db);

            List<Ingredient> all = repo.findAll();
            sb.append("Connected to SQLite via JDBC. Current ingredients in database: ").append(all.size()).append("\n\n");

            Ingredient testItem = new Ingredient("ING-FX-DEMO", "Saffron (Kesar)", Category.SPICE, 0.01, "kg", 0.005, 180000.0,
                    LocalDate.now().plusMonths(12), "Spice Vault");

            repo.insert(testItem);
            sb.append("1. PreparedStatement INSERT executed: ").append(testItem.getName()).append(" (₹").append(testItem.getUnitPrice()).append(")\n");

            var found = repo.findById("ING-FX-DEMO");
            sb.append("2. ResultSet SELECT executed: Found = ").append(found.isPresent() ? found.get().getName() : "None").append("\n");

            repo.deleteById("ING-FX-DEMO");
            sb.append("3. PreparedStatement DELETE executed: Cleaned up demo record.\n");

        } catch (Exception e) {
            sb.append("JDBC execution note: SQLite JDBC driver library required at runtime: ").append(e.getMessage()).append("\n");
        }

        outputArea.setText(sb.toString());
    }

    // 7. THREADS & CONCURRENCY
    private void executeConcurrencyDemonstration() {
        conceptTitleLabel.setText("Concept: Unit 3 — Thread, Runnable, Synchronization & Safe Deadlock Prevention");
        sourceFilePathLabel.setText("Source Files: smart-rasoi-java/core/src/com/smartrasoi/threading/ReportGeneratorThread.java & SafeDeadlockDemo.java");
        conceptExplanationArea.setText("Demonstrates creating background threads extending Thread, thread priorities, join() synchronization, " +
                "and an isolated, safely-terminable deadlock simulation that demonstrates the Coffman conditions without hanging the JVM.");

        StringBuilder sb = new StringBuilder();
        sb.append(">>> EXECUTING MULTITHREADING & SAFE DEADLOCK SIMULATION...\n\n");

        InventoryService service = new InventoryService();
        service.addIngredient(new Ingredient("Basmati Rice", Category.GRAIN, 0.5, "kg", 95.0, 1.0)); // low stock

        ReportGeneratorThread thread = new ReportGeneratorThread(service);
        thread.start();
        try {
            thread.join();
            sb.append(thread.getGeneratedReportSummary()).append("\n");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        sb.append("\n--- Safe Deadlock Simulation (Circular Wait Prevention) ---\n");
        SafeDeadlockDemo deadlockDemo = new SafeDeadlockDemo();
        sb.append(deadlockDemo.executeSafeDeadlockSimulation());

        outputArea.setText(sb.toString());
    }

    public static void main(String[] args) {
        launch(args);
    }
}
