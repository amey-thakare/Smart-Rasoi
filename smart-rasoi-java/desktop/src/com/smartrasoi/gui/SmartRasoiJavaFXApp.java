package com.smartrasoi.gui;

import com.smartrasoi.db.DataSeeder;
import com.smartrasoi.db.DatabaseConnection;
import com.smartrasoi.db.IngredientJdbcRepository;
import com.smartrasoi.db.UserJdbcRepository;
import com.smartrasoi.exception.DuplicateUserException;
import com.smartrasoi.exception.InvalidQuantityException;
import com.smartrasoi.model.*;
import com.smartrasoi.service.InventoryService;
import com.smartrasoi.service.RecipeService;
import com.smartrasoi.service.ShoppingService;
import com.smartrasoi.util.CostCalculable;
import javafx.application.Application;
import javafx.beans.property.SimpleDoubleProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.stage.Stage;

import java.sql.SQLException;
import java.time.LocalDate;
import java.util.Optional;

/**
 * Unit 5 Syllabus Topic: JavaFX Desktop GUI & JDBC Integration.
 *
 * Demonstrates:
 * - Stage and Scene lifecycle
 * - MenuBar, Menu, MenuItem, SeparatorMenuItem
 * - TabPane for multi-screen navigation
 * - TableView and TableColumn with observable data binding
 * - Form input controls: TextField, PasswordField, ComboBox, DatePicker, Button
 * - Event handling via ActionEvent handlers and lambdas
 * - Input validation, dialogs, and Alerts (INFORMATION, WARNING, ERROR)
 * - Syllabus Demonstration Screen integration (Requirement 12)
 */
public class SmartRasoiJavaFXApp extends Application {

    private final InventoryService inventoryService = new InventoryService();
    private final RecipeService recipeService = new RecipeService();
    private final ShoppingService shoppingService = new ShoppingService();

    private ObservableList<Ingredient> observableInventory;
    private TableView<Ingredient> inventoryTable;
    private Label dashboardSummaryLabel;
    private Stage primaryStage;

    @Override
    public void start(Stage primaryStage) {
        this.primaryStage = primaryStage;
        primaryStage.setTitle("Smart Rasoi — JavaFX Academic Desktop Application");

        // Initialize sample in-memory data
        initSampleData();

        BorderPane root = new BorderPane();

        // 1. MenuBar (Unit 5)
        MenuBar menuBar = createMenuBar();
        root.setTop(menuBar);

        // 2. TabPane Navigation (Unit 5)
        TabPane tabPane = new TabPane();
        tabPane.setTabClosingPolicy(TabPane.TabClosingPolicy.UNAVAILABLE);

        Tab tabDashboard = new Tab("📊 Dashboard", createDashboardView());
        Tab tabInventory = new Tab("🥫 Inventory Table", createInventoryTableView());
        Tab tabRecipes = new Tab("📖 Recipes & Matcher", createRecipeCatalogueView());
        Tab tabPlanner = new Tab("📅 Meal Planner", createMealPlanningView());
        Tab tabShopping = new Tab("🛒 Shopping & Budget", createShoppingListView());
        Tab tabRegister = new Tab("🔐 User Registration & Login", createAuthView());

        // Tab 7: Interactive Syllabus Demonstration Screen (Requirement 12)
        SyllabusDemoScreen demoScreen = new SyllabusDemoScreen();
        Tab tabSyllabus = new Tab("🎓 Syllabus Demonstrations", demoScreen.createDemoPanel());

        tabPane.getTabs().addAll(tabDashboard, tabInventory, tabRecipes, tabPlanner, tabShopping, tabRegister, tabSyllabus);
        root.setCenter(tabPane);

        // 3. Scene & Stage Setup
        Scene scene = new Scene(root, 1024, 768);
        primaryStage.setScene(scene);
        primaryStage.setMinWidth(900);
        primaryStage.setMinHeight(650);
        primaryStage.show();
    }

    private void initSampleData() {
        inventoryService.addIngredient(new Ingredient("ING-1", "Basmati Rice", Category.GRAIN, 5.0, "kg", 1.0, 95.0, LocalDate.now().plusMonths(6), "Pantry"));
        inventoryService.addIngredient(new Ingredient("ING-2", "Toor Dal", Category.PULSE, 2.0, "kg", 0.5, 140.0, LocalDate.now().plusMonths(8), "Pantry"));
        inventoryService.addIngredient(new Ingredient("ING-3", "Turmeric Powder", Category.SPICE, 0.25, "kg", 0.1, 320.0, LocalDate.now().plusMonths(12), "Spice Rack"));
        inventoryService.addIngredient(new Ingredient("ING-4", "Pure Cow Ghee", Category.DAIRY, 1.0, "l", 0.2, 650.0, LocalDate.now().plusMonths(4), "Pantry"));
        inventoryService.addIngredient(new Ingredient("ING-5", "Fresh Malai Paneer", Category.DAIRY, 0.4, "kg", 0.2, 360.0, LocalDate.now().plusDays(5), "Fridge"));
        inventoryService.addIngredient(new Ingredient("ING-6", "Onions", Category.VEGETABLE, 3.0, "kg", 1.0, 40.0, LocalDate.now().plusDays(10), "Pantry"));

        Recipe dalKhichdi = new Recipe("REC-1", "Homestyle Moong Dal Khichdi", "Comforting rice & lentil one-pot dish",
                Category.GRAIN, "Indian", "Easy", 10, 20, 2);
        dalKhichdi.addIngredient(new RecipeIngredient("Basmati Rice", 1.0, "kg"));
        dalKhichdi.addIngredient(new RecipeIngredient("Toor Dal", 0.5, "kg"));
        dalKhichdi.addIngredient(new RecipeIngredient("Pure Cow Ghee", 0.05, "l"));
        recipeService.addRecipe(dalKhichdi);

        observableInventory = FXCollections.observableArrayList(inventoryService.getAllIngredients());
    }

    // ==========================================
    // 1. MENUBAR (Unit 5)
    // ==========================================
    private MenuBar createMenuBar() {
        MenuBar menuBar = new MenuBar();

        Menu fileMenu = new Menu("File");
        MenuItem seedDbItem = new MenuItem("Seed Local Database (JDBC)");
        seedDbItem.setOnAction(e -> seedDatabaseAction());
        MenuItem exitItem = new MenuItem("Exit");
        exitItem.setOnAction(e -> primaryStage.close());
        fileMenu.getItems().addAll(seedDbItem, new SeparatorMenuItem(), exitItem);

        Menu actionsMenu = new Menu("Actions");
        MenuItem refreshItem = new MenuItem("Refresh Inventory");
        refreshItem.setOnAction(e -> refreshInventoryData());
        actionsMenu.getItems().add(refreshItem);

        Menu helpMenu = new Menu("Help");
        MenuItem aboutItem = new MenuItem("About Smart Rasoi Academic Layer");
        aboutItem.setOnAction(e -> showInformationAlert("About", "Smart Rasoi Academic JavaFX Application\nDemonstrating Units 1-7 of University Syllabus."));
        helpMenu.getItems().add(aboutItem);

        menuBar.getMenus().addAll(fileMenu, actionsMenu, helpMenu);
        return menuBar;
    }

    // ==========================================
    // 2. DASHBOARD VIEW
    // ==========================================
    private Pane createDashboardView() {
        VBox vbox = new VBox(15);
        vbox.setPadding(new Insets(20));

        Label title = new Label("Smart Rasoi — Kitchen Overview Dashboard");
        title.setStyle("-fx-font-size: 22px; -fx-font-weight: bold; -fx-text-fill: #0f172a;");

        dashboardSummaryLabel = new Label();
        updateDashboardSummaryText();
        dashboardSummaryLabel.setStyle("-fx-font-size: 14px; -fx-text-fill: #334155;");

        // Metrics Grid
        GridPane grid = new GridPane();
        grid.setHgap(20);
        grid.setVgap(20);

        grid.add(createMetricCard("Total Pantry Items", String.valueOf(inventoryService.getAllIngredients().size()), "#3b82f6"), 0, 0);
        grid.add(createMetricCard("Low Stock Items", String.valueOf(inventoryService.getLowStockIngredients().size()), "#ef4444"), 1, 0);
        grid.add(createMetricCard("Total Pantry Valuation", String.format("₹%.2f", inventoryService.calculateTotalInventoryValue()), "#10b981"), 2, 0);
        grid.add(createMetricCard("Catalogue Recipes", String.valueOf(recipeService.getAllRecipes().size()), "#8b5cf6"), 0, 1);

        vbox.getChildren().addAll(title, dashboardSummaryLabel, grid);
        return vbox;
    }

    private void updateDashboardSummaryText() {
        dashboardSummaryLabel.setText(String.format("Live Inventory Status: %d ingredients tracked, ₹%.2f total estimated valuation.",
                inventoryService.getAllIngredients().size(), inventoryService.calculateTotalInventoryValue()));
    }

    private Pane createMetricCard(String title, String value, String accentColor) {
        VBox card = new VBox(8);
        card.setPadding(new Insets(16));
        card.setPrefWidth(220);
        card.setStyle(String.format("-fx-background-color: white; -fx-border-color: %s; -fx-border-width: 0 0 0 4; " +
                "-fx-border-radius: 6; -fx-background-radius: 6; -fx-effect: dropshadow(gaussian, rgba(0,0,0,0.06), 8, 0, 0, 2);", accentColor));

        Label t = new Label(title);
        t.setStyle("-fx-font-size: 13px; -fx-text-fill: #64748b;");
        Label v = new Label(value);
        v.setStyle("-fx-font-size: 22px; -fx-font-weight: bold; -fx-text-fill: #0f172a;");

        card.getChildren().addAll(t, v);
        return card;
    }

    // ==========================================
    // 3. INVENTORY TABLE VIEW & FORM (Unit 5)
    // ==========================================
    private Pane createInventoryTableView() {
        VBox vbox = new VBox(15);
        vbox.setPadding(new Insets(20));

        Label title = new Label("Pantry Inventory Table (TableView & TableColumn)");
        title.setStyle("-fx-font-size: 18px; -fx-font-weight: bold;");

        // TableView
        inventoryTable = new TableView<>();
        inventoryTable.setItems(observableInventory);
        inventoryTable.setPrefHeight(320);

        TableColumn<Ingredient, String> idCol = new TableColumn<>("ID");
        idCol.setCellValueFactory(data -> new SimpleStringProperty(data.getValue().getId()));
        idCol.setPrefWidth(90);

        TableColumn<Ingredient, String> nameCol = new TableColumn<>("Ingredient Name");
        nameCol.setCellValueFactory(data -> new SimpleStringProperty(data.getValue().getName()));
        nameCol.setPrefWidth(180);

        TableColumn<Ingredient, String> catCol = new TableColumn<>("Category");
        catCol.setCellValueFactory(data -> new SimpleStringProperty(data.getValue().getCategory().name()));
        catCol.setPrefWidth(120);

        TableColumn<Ingredient, String> qtyCol = new TableColumn<>("Quantity");
        qtyCol.setCellValueFactory(data -> new SimpleStringProperty(String.format("%.2f %s", data.getValue().getQuantity(), data.getValue().getUnit())));
        qtyCol.setPrefWidth(120);

        TableColumn<Ingredient, String> priceCol = new TableColumn<>("Unit Price");
        priceCol.setCellValueFactory(data -> new SimpleStringProperty(CostCalculable.formatCurrency(data.getValue().getUnitPrice())));
        priceCol.setPrefWidth(110);

        TableColumn<Ingredient, String> expCol = new TableColumn<>("Expiry Date");
        expCol.setCellValueFactory(data -> new SimpleStringProperty(data.getValue().getExpiryDate() != null ? data.getValue().getExpiryDate().toString() : "N/A"));
        expCol.setPrefWidth(110);

        TableColumn<Ingredient, String> statusCol = new TableColumn<>("Status");
        statusCol.setCellValueFactory(data -> new SimpleStringProperty(data.getValue().isLowStock() ? "⚠️ LOW STOCK" : "✅ Normal"));
        statusCol.setPrefWidth(120);

        inventoryTable.getColumns().addAll(idCol, nameCol, catCol, qtyCol, priceCol, expCol, statusCol);

        // Add Ingredient Form
        TitledPane formPane = new TitledPane();
        formPane.setText("Add New Ingredient Form (Event Handlers & Form Validation)");
        GridPane formGrid = new GridPane();
        formGrid.setHgap(10);
        formGrid.setVgap(10);
        formGrid.setPadding(new Insets(10));

        TextField txtName = new TextField();
        txtName.setPromptText("e.g. Mustard Seeds");

        ComboBox<Category> cmbCategory = new ComboBox<>(FXCollections.observableArrayList(Category.values()));
        cmbCategory.setValue(Category.SPICE);

        TextField txtQty = new TextField();
        txtQty.setPromptText("Quantity (e.g. 1.5)");

        ComboBox<String> cmbUnit = new ComboBox<>(FXCollections.observableArrayList("kg", "g", "l", "ml", "packet"));
        cmbUnit.setValue("kg");

        TextField txtPrice = new TextField();
        txtPrice.setPromptText("Unit Price (₹)");

        DatePicker datePicker = new DatePicker(LocalDate.now().plusMonths(6));

        Button btnAdd = new Button("Add Ingredient");
        btnAdd.setStyle("-fx-background-color: #2563eb; -fx-text-fill: white; -fx-font-weight: bold;");

        Button btnDelete = new Button("Delete Selected");
        btnDelete.setStyle("-fx-background-color: #dc2626; -fx-text-fill: white; -fx-font-weight: bold;");

        formGrid.add(new Label("Name:"), 0, 0);
        formGrid.add(txtName, 1, 0);
        formGrid.add(new Label("Category:"), 2, 0);
        formGrid.add(cmbCategory, 3, 0);

        formGrid.add(new Label("Quantity:"), 0, 1);
        formGrid.add(txtQty, 1, 1);
        formGrid.add(new Label("Unit:"), 2, 1);
        formGrid.add(cmbUnit, 3, 1);

        formGrid.add(new Label("Price (₹):"), 0, 2);
        formGrid.add(txtPrice, 1, 2);
        formGrid.add(new Label("Expiry:"), 2, 2);
        formGrid.add(datePicker, 3, 2);

        HBox btnBox = new HBox(10, btnAdd, btnDelete);
        formGrid.add(btnBox, 1, 3, 3, 1);

        formPane.setContent(formGrid);

        // Event Handlers (Unit 5)
        btnAdd.setOnAction(e -> {
            String name = txtName.getText();
            if (name == null || name.trim().isEmpty()) {
                showErrorAlert("Validation Error", "Ingredient name cannot be empty.");
                return;
            }

            double qty, price;
            try {
                qty = Double.parseDouble(txtQty.getText());
                price = Double.parseDouble(txtPrice.getText());
                if (qty <= 0 || price < 0) throw new NumberFormatException();
            } catch (Exception ex) {
                showErrorAlert("Input Error", "Quantity must be > 0 and Price must be >= 0.");
                return;
            }

            Ingredient newItem = new Ingredient(
                    "ING-" + (observableInventory.size() + 1),
                    name.trim(),
                    cmbCategory.getValue(),
                    qty,
                    cmbUnit.getValue(),
                    1.0,
                    price,
                    datePicker.getValue(),
                    "Pantry"
            );

            inventoryService.addIngredient(newItem);
            observableInventory.add(newItem);
            updateDashboardSummaryText();
            showInformationAlert("Success", "Added ingredient: " + newItem.getName());

            txtName.clear();
            txtQty.clear();
            txtPrice.clear();
        });

        btnDelete.setOnAction(e -> {
            Ingredient selected = inventoryTable.getSelectionModel().getSelectedItem();
            if (selected == null) {
                showErrorAlert("Selection Error", "Please select an ingredient from the table to delete.");
                return;
            }
            observableInventory.remove(selected);
            updateDashboardSummaryText();
            showInformationAlert("Deleted", "Removed ingredient: " + selected.getName());
        });

        vbox.getChildren().addAll(title, inventoryTable, formPane);
        return vbox;
    }

    // ==========================================
    // 4. RECIPE CATALOGUE & MATCHER VIEW
    // ==========================================
    private Pane createRecipeCatalogueView() {
        VBox vbox = new VBox(15);
        vbox.setPadding(new Insets(20));

        Label title = new Label("Recipe Catalogue & Inventory Matcher (Unit 4 Lambdas & Collections)");
        title.setStyle("-fx-font-size: 18px; -fx-font-weight: bold;");

        ListView<String> recipeListView = new ListView<>();
        for (Recipe r : recipeService.getAllRecipes()) {
            RecipeService.RecipeMatchResult match = recipeService.matchRecipe(r, inventoryService);
            recipeListView.getItems().add(String.format("%s | %s | %d mins | Can Cook? %s (%.0f%% Match)",
                    r.getTitle(), r.getCuisine(), r.getTotalTimeMinutes(),
                    match.isCanCook() ? "✅ YES" : "❌ NO", match.getMatchPercentage()));
        }

        vbox.getChildren().addAll(title, recipeListView);
        return vbox;
    }

    // ==========================================
    // 5. MEAL PLANNING VIEW
    // ==========================================
    private Pane createMealPlanningView() {
        VBox vbox = new VBox(15);
        vbox.setPadding(new Insets(20));

        Label title = new Label("Meal Planning Form (DatePicker, ComboBox & Domain Scheduling)");
        title.setStyle("-fx-font-size: 18px; -fx-font-weight: bold;");

        GridPane grid = new GridPane();
        grid.setHgap(10);
        grid.setVgap(10);

        DatePicker planDate = new DatePicker(LocalDate.now());
        ComboBox<MealPlan.MealType> mealTypeCmb = new ComboBox<>(FXCollections.observableArrayList(MealPlan.MealType.values()));
        mealTypeCmb.setValue(MealPlan.MealType.DINNER);

        ComboBox<String> recipeCmb = new ComboBox<>();
        for (Recipe r : recipeService.getAllRecipes()) {
            recipeCmb.getItems().add(r.getTitle());
        }
        if (!recipeCmb.getItems().isEmpty()) recipeCmb.setValue(recipeCmb.getItems().get(0));

        TextField servingsTxt = new TextField("2");

        Button btnSchedule = new Button("Schedule Meal Plan");
        btnSchedule.setStyle("-fx-background-color: #059669; -fx-text-fill: white; -fx-font-weight: bold;");

        grid.add(new Label("Plan Date:"), 0, 0);
        grid.add(planDate, 1, 0);
        grid.add(new Label("Meal Type:"), 0, 1);
        grid.add(mealTypeCmb, 1, 1);
        grid.add(new Label("Recipe:"), 0, 2);
        grid.add(recipeCmb, 1, 2);
        grid.add(new Label("Servings:"), 0, 3);
        grid.add(servingsTxt, 1, 3);
        grid.add(btnSchedule, 1, 4);

        TextArea scheduledLog = new TextArea();
        scheduledLog.setEditable(false);
        scheduledLog.setPrefRowCount(6);

        btnSchedule.setOnAction(e -> {
            String logEntry = String.format("Scheduled %s for %s on %s (Servings: %s)\n",
                    recipeCmb.getValue(), mealTypeCmb.getValue(), planDate.getValue(), servingsTxt.getText());
            scheduledLog.appendText(logEntry);
            showInformationAlert("Meal Planned", "Scheduled meal added to planner!");
        });

        vbox.getChildren().addAll(title, grid, new Label("Scheduled Meal Activity:"), scheduledLog);
        return vbox;
    }

    // ==========================================
    // 6. SHOPPING LIST & BUDGET VIEW
    // ==========================================
    private Pane createShoppingListView() {
        VBox vbox = new VBox(15);
        vbox.setPadding(new Insets(20));

        Label title = new Label("Smart Shopping List & Grocery Budget");
        title.setStyle("-fx-font-size: 18px; -fx-font-weight: bold;");

        ShoppingList sampleList = new ShoppingList("SL-DEMO", "user-1", "Weekly Market Run", 1500.0);
        sampleList.addItem(new ShoppingListItem("ITEM-1", "Basmati Rice (Extra)", Category.GRAIN, 2.0, "kg", 190.0));
        sampleList.addItem(new ShoppingListItem("ITEM-2", "Green Chillies", Category.VEGETABLE, 0.25, "kg", 20.0));
        sampleList.addItem(new ShoppingListItem("ITEM-3", "Coriander Leaves", Category.VEGETABLE, 0.2, "kg", 15.0));

        Label budgetLabel = new Label(String.format("Budget: ₹%.2f | Estimated Total: ₹%.2f | Over Budget? %s",
                sampleList.getBudget(), sampleList.calculateTotalCost(), sampleList.isOverBudget()));
        budgetLabel.setStyle("-fx-font-size: 14px; -fx-font-weight: bold; -fx-text-fill: #2563eb;");

        ListView<String> itemsList = new ListView<>();
        for (ShoppingListItem item : sampleList.getItems()) {
            itemsList.getItems().add(item.toString());
        }

        vbox.getChildren().addAll(title, budgetLabel, itemsList);
        return vbox;
    }

    // ==========================================
    // 7. USER REGISTRATION & AUTHENTICATION VIEW (Unit 11)
    // ==========================================
    private Pane createAuthView() {
        VBox vbox = new VBox(15);
        vbox.setPadding(new Insets(20));

        Label title = new Label("Academic User Registration & Authentication (Unit 11 Salted SHA-256)");
        title.setStyle("-fx-font-size: 18px; -fx-font-weight: bold;");

        GridPane grid = new GridPane();
        grid.setHgap(10);
        grid.setVgap(10);

        TextField txtUserName = new TextField();
        TextField txtUserEmail = new TextField();
        PasswordField txtPassword = new PasswordField();

        Button btnRegister = new Button("Register New User");
        btnRegister.setStyle("-fx-background-color: #2563eb; -fx-text-fill: white; -fx-font-weight: bold;");

        grid.add(new Label("Full Name:"), 0, 0);
        grid.add(txtUserName, 1, 0);
        grid.add(new Label("Email:"), 0, 1);
        grid.add(txtUserEmail, 1, 1);
        grid.add(new Label("Password:"), 0, 2);
        grid.add(txtPassword, 1, 2);
        grid.add(btnRegister, 1, 3);

        TextArea authOutput = new TextArea();
        authOutput.setEditable(false);
        authOutput.setPrefRowCount(8);

        btnRegister.setOnAction(e -> {
            String name = txtUserName.getText();
            String email = txtUserEmail.getText();
            String pass = txtPassword.getText();

            if (name.isEmpty() || email.isEmpty() || pass.length() < 6) {
                showErrorAlert("Validation", "Name, valid email, and minimum 6 character password required.");
                return;
            }

            try {
                User user = new User("USR-FX", name, email);
                user.setAndHashPassword(pass);

                authOutput.appendText("=== USER REGISTERED (SECURE CREDENTIALS) ===\n");
                authOutput.appendText("Name: " + user.getName() + " | Email: " + user.getEmail() + "\n");
                authOutput.appendText("Salt (SecureRandom): " + user.getSalt() + "\n");
                authOutput.appendText("Password Hash: " + user.getPasswordHash() + " (SALTED SHA-256)\n");
                authOutput.appendText("Password Verification Check: " + user.verifyPassword(pass) + "\n\n");

                showInformationAlert("Success", "User registered and credentials hashed with salted SHA-256!");
            } catch (Exception ex) {
                showErrorAlert("Error", ex.getMessage());
            }
        });

        vbox.getChildren().addAll(title, grid, authOutput);
        return vbox;
    }

    private void seedDatabaseAction() {
        try {
            DatabaseConnection db = DatabaseConnection.getInstance();
            DataSeeder seeder = new DataSeeder(db);
            seeder.seedAll();
            showInformationAlert("Database Seeded", "SQLite tables initialized and seed records inserted successfully.");
            refreshInventoryData();
        } catch (Exception e) {
            showErrorAlert("Database Error", "Ensure sqlite-jdbc library is installed: " + e.getMessage());
        }
    }

    private void refreshInventoryData() {
        try {
            DatabaseConnection db = DatabaseConnection.getInstance();
            IngredientJdbcRepository repo = new IngredientJdbcRepository(db);
            var dbItems = repo.findAll();
            if (!dbItems.isEmpty()) {
                observableInventory.setAll(dbItems);
                updateDashboardSummaryText();
            }
        } catch (Exception ignored) {}
    }

    private void showInformationAlert(String title, String message) {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }

    private void showErrorAlert(String title, String message) {
        Alert alert = new Alert(Alert.AlertType.ERROR);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }

    public static void main(String[] args) {
        launch(args);
    }
}
