package com.smartrasoi;

import com.smartrasoi.exception.InsufficientInventoryException;
import com.smartrasoi.exception.InvalidQuantityException;
import com.smartrasoi.model.*;
import com.smartrasoi.serialization.AppStateSerializer;
import com.smartrasoi.serialization.CsvExporter;
import com.smartrasoi.service.InventoryService;
import com.smartrasoi.service.RecipeService;
import com.smartrasoi.service.ShoppingService;
import com.smartrasoi.threading.InventorySyncRunnable;
import com.smartrasoi.threading.ReportGeneratorThread;
import com.smartrasoi.threading.SafeDeadlockDemo;
import com.smartrasoi.threading.SharedInventoryQueue;
import com.smartrasoi.util.CostCalculable;
import com.smartrasoi.util.GenericRepository;
import com.smartrasoi.util.UnitConverter;

import java.io.File;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Smart Rasoi - Core Java Syllabus Demonstration Runner.
 *
 * Demonstrates:
 * - Unit 1: Fundamentals, Types, Operators, Control Structures, Arrays, Command-Line Args
 * - Unit 2: OOP, Inheritance, Polymorphism, Abstract Classes, Interfaces, Inner Classes
 * - Unit 3: Exception Handling, Concurrency, Thread Synchronization, Inter-Thread Communication, Safe Deadlock
 * - Unit 4: Files, Streams, Serialization, Collections, Generics, Lambdas, Comparators
 *
 * Can be executed via:
 *   java -cp bin com.smartrasoi.CoreSyllabusRunner
 */
public class CoreSyllabusRunner {

    public static void main(String[] args) {
        System.out.println("================================================================================");
        System.out.println("  SMART RASOI - JAVA SYLLABUS ACADEMIC DEMONSTRATION RUNNER (UNITS 1 - 4)");
        System.out.println("================================================================================");

        // Command-line arguments demonstration (Unit 1)
        System.out.println("\n[UNIT 1] Command-Line Arguments:");
        if (args.length > 0) {
            System.out.println("  Arguments provided: " + Arrays.toString(args));
        } else {
            System.out.println("  No arguments passed; running with standard syllabus demonstration defaults.");
        }

        demonstrateUnit1Fundamentals();
        demonstrateUnit2ObjectOrientedProgramming();
        demonstrateUnit3ExceptionsAndConcurrency();
        demonstrateUnit4FilesSerializationCollections();

        System.out.println("\n================================================================================");
        System.out.println("  ALL CORE JAVA SYLLABUS DEMONSTRATIONS EXECUTED CLEANLY AND SUCCESSFULLY!");
        System.out.println("================================================================================\n");
    }

    // =========================================================================
    // UNIT 1: JAVA FUNDAMENTALS
    // =========================================================================
    private static void demonstrateUnit1Fundamentals() {
        System.out.println("\n--------------------------------------------------------------------------------");
        System.out.println(">>> DEMO 1: UNIT 1 - FUNDAMENTALS, TYPES, OPERATORS, LOOPS & ARRAYS");
        System.out.println("--------------------------------------------------------------------------------");

        // Primitive data types & wrapper classes
        int servingCount = 4;                           // primitive int
        double pricePerKg = 85.50;                      // primitive double
        boolean inStock = true;                         // primitive boolean
        Integer boxedCount = Integer.valueOf(servingCount); // Wrapper class & Autoboxing
        Double boxedPrice = Double.valueOf(pricePerKg);

        System.out.println("1. Primitives & Wrappers:");
        System.out.println("   servings=" + servingCount + ", pricePerKg=" + pricePerKg + ", inStock=" + inStock);
        System.out.println("   Boxed Integer=" + boxedCount + ", Boxed Double=" + boxedPrice);

        // Type casting: Widening (implicit) and Narrowing (explicit)
        double weightInKg = 2.75;
        int gramsRounded = UnitConverter.convertQuantityToPantryGramsRounded(weightInKg); // Narrowing inside method
        System.out.println("2. Type Casting (Widening & Narrowing):");
        System.out.println("   Double weight=" + weightInKg + " kg -> Explicit narrowing to int grams=" + gramsRounded + " g");

        // Operators, expressions & precedence
        NutritionInfo nutrition = new NutritionInfo(0, 15.0, 45.0, 8.0, 5.0);
        double computedCalories = nutrition.computeEstimatedCaloriesFromMacros();
        System.out.println("3. Expressions & Precedence (4-4-9 Atwater Factor):");
        System.out.println("   Protein: 15g, Carbs: 45g, Fat: 8g -> Computed Calories: " + computedCalories + " kcal");

        // One-dimensional array
        double[] ingredientQuantities = { 1.5, 0.5, 2.0, 0.25 };
        double totalQuantity = 0.0;
        // Enhanced for loop
        for (double q : ingredientQuantities) {
            totalQuantity += q;
        }
        System.out.println("4. 1D Array & Enhanced for-loop: total quantity=" + totalQuantity + " kg");

        // Multidimensional array (7x3 weekly meal calorie matrix)
        double[][] weeklyMealCalories = {
                { 350.0, 600.0, 550.0 }, // Monday
                { 400.0, 650.0, 500.0 }, // Tuesday
                { 320.0, 580.0, 620.0 }  // Wednesday
        };
        double[] dailyTotals = NutritionInfo.calculateDailyCalorieTotals(weeklyMealCalories);
        System.out.println("5. 2D Array & Nested Loops (Daily Calorie Totals):");
        for (int i = 0; i < dailyTotals.length; i++) {
            System.out.println("   Day " + (i + 1) + " total: " + dailyTotals[i] + " kcal");
        }

        // Switch-case statement on strings
        String unit = "tbsp";
        double baseStandardMl = UnitConverter.toBaseStandard(2.0, unit);
        System.out.println("6. Switch-Case statement: 2 " + unit + " = " + baseStandardMl + " ml standard volume.");
    }

    // =========================================================================
    // UNIT 2: OBJECT-ORIENTED PROGRAMMING
    // =========================================================================
    private static void demonstrateUnit2ObjectOrientedProgramming() {
        System.out.println("\n--------------------------------------------------------------------------------");
        System.out.println(">>> DEMO 2: UNIT 2 - OOP, INHERITANCE, POLYMORPHISM, INTERFACES & INNER CLASSES");
        System.out.println("--------------------------------------------------------------------------------");

        // Polymorphic reference: KitchenItem reference pointing to Ingredient and PerishableIngredient
        KitchenItem item1 = new Ingredient("Basmati Rice", Category.GRAIN, 5.0, "kg", 90.0, 1.0);
        KitchenItem item2 = new PerishableIngredient("Fresh Malai Paneer", Category.DAIRY, 0.5, "kg", 320.0,
                LocalDate.now().plusDays(4), 4.0);

        System.out.println("1. Polymorphism (Abstract class reference KitchenItem pointing to concrete instances):");
        System.out.println("   Item 1: " + item1.getName() + " -> Storage: " + item1.getStorageRequirement());
        System.out.println("   Item 2: " + item2.getName() + " -> Storage: " + item2.getStorageRequirement());

        // Interface implementation & Default/Static methods
        CostCalculable costItem = (CostCalculable) item1;
        System.out.println("2. Interface CostCalculable implementation:");
        System.out.println("   Calculated Value: " + CostCalculable.formatCurrency(costItem.calculateTotalCost()));
        System.out.println("   Budget ₹400 exceeded? " + costItem.isCostExceeded(400.0));
        System.out.println("   Budget ₹500 exceeded? " + costItem.isCostExceeded(500.0));

        // Method Overloading
        Ingredient pulse = new Ingredient("Toor Dal", Category.PULSE, 2.0, "kg", 140.0, 1.0);
        try {
            System.out.println("3. Method Overloading demonstration:");
            System.out.println("   Initial Dal Qty: " + pulse.getQuantity() + " kg @ ₹" + pulse.getUnitPrice());
            pulse.addStock(1.0); // Overloaded method 1
            System.out.println("   After addStock(1.0): " + pulse.getQuantity() + " kg");
            pulse.addStock(1.0, 160.0); // Overloaded method 3 with weighted average pricing
            System.out.println("   After addStock(1.0, ₹160.0): " + pulse.getQuantity() + " kg @ weighted ₹" + pulse.getUnitPrice() + "/kg");
        } catch (InvalidQuantityException e) {
            System.err.println("Error: " + e.getMessage());
        }

        // Inner class: Member inner class (StockSnapshot)
        Ingredient.StockSnapshot snapshot = pulse.new StockSnapshot();
        System.out.println("4. Member Inner Class (StockSnapshot):");
        System.out.println("   Snapshot recorded for " + snapshot.getIngredientName() + ": " + snapshot.getRecordedQuantity() + " kg on " + snapshot.getSnapshotDate());

        // Static Nested class (Builder pattern)
        Ingredient builtItem = new Ingredient.Builder()
                .name("Kashmiri Red Chilli Powder")
                .category(Category.SPICE)
                .quantity(0.2)
                .unit("kg")
                .unitPrice(450.0)
                .location("Spice Rack")
                .build();
        System.out.println("5. Static Nested Class (Ingredient.Builder):");
        System.out.println("   Constructed: " + builtItem);
    }

    // =========================================================================
    // UNIT 3: EXCEPTION HANDLING AND CONCURRENCY
    // =========================================================================
    private static void demonstrateUnit3ExceptionsAndConcurrency() {
        System.out.println("\n--------------------------------------------------------------------------------");
        System.out.println(">>> DEMO 3: UNIT 3 - EXCEPTIONS & MULTITHREADING (THREAD, RUNNABLE, SYNC, DEADLOCK)");
        System.out.println("--------------------------------------------------------------------------------");

        InventoryService service = new InventoryService();
        Ingredient milk = new Ingredient("Full Cream Milk", Category.DAIRY, 1.0, "l", 66.0, 0.5);
        service.addIngredient(milk);

        // Checked Exception Handling: try-catch-finally with throw and throws
        System.out.println("1. Checked Exception (InsufficientInventoryException) & try-catch-finally:");
        try {
            System.out.println("   Attempting to deduct 3.0 liters of Milk (current stock: 1.0 l)...");
            service.deductStockForCooking("Full Cream Milk", 3.0, "l");
        } catch (InsufficientInventoryException e) {
            System.out.println("   [CAUGHT EXPECTED EXCEPTION] " + e.getMessage());
            System.out.println("   Error Code: " + e.getErrorCode() + " | Shortfall: " + e.getShortfall() + " l");
        } catch (InvalidQuantityException e) {
            System.out.println("   [CAUGHT] Invalid quantity: " + e.getMessage());
        } finally {
            System.out.println("   [FINALLY BLOCK EXECUTED] Cleanup and audit check guaranteed.");
        }

        // Multithreading: extending Thread (ReportGeneratorThread)
        System.out.println("2. Thread creation extending java.lang.Thread:");
        ReportGeneratorThread reportThread = new ReportGeneratorThread(service);
        System.out.println("   Thread state before start(): " + reportThread.getState());
        reportThread.start();
        System.out.println("   Thread isAlive()? " + reportThread.isAlive());

        try {
            // join() method: waits for thread termination
            reportThread.join();
            System.out.println("   Thread state after join(): " + reportThread.getState());
            System.out.println("   Report duration: " + reportThread.getExecutionDurationMs() + "ms");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Multithreading: implementing Runnable (InventorySyncRunnable)
        System.out.println("3. Thread creation implementing java.lang.Runnable:");
        AtomicInteger syncCounter = new AtomicInteger(0);
        Ingredient rice = new Ingredient("Rice", Category.GRAIN, 10.0, "kg", 60.0, 2.0);
        InventorySyncRunnable syncTask = new InventorySyncRunnable(service, rice, syncCounter);
        Thread workerThread = new Thread(syncTask, "SyncWorkerThread");
        workerThread.start();
        try {
            workerThread.join();
            System.out.println("   Runnable thread joined. Sync counter: " + syncCounter.get());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Inter-Thread Communication: wait() and notifyAll()
        System.out.println("4. Inter-Thread Communication (wait & notifyAll) in SharedInventoryQueue:");
        SharedInventoryQueue queue = new SharedInventoryQueue(2); // capacity 2
        Thread producer = new Thread(() -> {
            try {
                queue.produceIngredient(new Ingredient("Sugar", 1.0, "kg", Category.GRAIN));
                queue.produceIngredient(new Ingredient("Tea Leaves", 0.5, "kg", Category.BEVERAGE));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        Thread consumer = new Thread(() -> {
            try {
                Ingredient consumed = queue.consumeIngredient();
                System.out.println("   Consumer thread consumed: " + consumed.getName());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        producer.start();
        consumer.start();
        try {
            producer.join();
            consumer.join();
            System.out.println("   Producer-Consumer synchronization completed cleanly. Queue size=" + queue.size());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Controlled Deadlock Demonstration
        System.out.println("5. Controlled Deadlock Demonstration (Safely-Terminating Simulation):");
        SafeDeadlockDemo deadlockDemo = new SafeDeadlockDemo();
        String deadlockOutput = deadlockDemo.executeSafeDeadlockSimulation();
        System.out.print(deadlockOutput);
    }

    // =========================================================================
    // UNIT 4: FILES, SERIALIZATION, COLLECTIONS & GENERICS
    // =========================================================================
    private static void demonstrateUnit4FilesSerializationCollections() {
        System.out.println("\n--------------------------------------------------------------------------------");
        System.out.println(">>> DEMO 4: UNIT 4 - FILES, SERIALIZATION, COLLECTIONS, COMPARATORS & GENERICS");
        System.out.println("--------------------------------------------------------------------------------");

        InventoryService service = new InventoryService();
        service.addIngredient(new Ingredient("Basmati Rice", Category.GRAIN, 4.0, "kg", 95.0, 1.0));
        service.addIngredient(new Ingredient("Moong Dal", Category.PULSE, 1.5, "kg", 130.0, 0.5));
        service.addIngredient(new Ingredient("Turmeric Powder", Category.SPICE, 0.2, "kg", 300.0, 0.1));
        service.addIngredient(new Ingredient("Ghee", Category.DAIRY, 0.8, "l", 650.0, 0.2));

        // Set for distinct element collection
        Set<String> uniqueNames = service.getUniqueIngredientNames();
        System.out.println("1. Set Collection (Unique ingredient names): " + uniqueNames);

        // Sorting using custom Comparators
        System.out.println("2. Comparators & Collections Sorting:");
        List<Ingredient> byQty = service.getIngredientsSortedByQuantityDesc();
        System.out.println("   Sorted by Quantity (Descending):");
        for (Ingredient i : byQty) {
            System.out.println("     - " + i.getName() + " (" + i.getQuantity() + " " + i.getUnit() + ")");
        }

        // Generics with bounded type parameters: GenericRepository<T extends KitchenItem & CostCalculable>
        System.out.println("3. Generics with Bounded Type Parameters <T extends KitchenItem & CostCalculable>:");
        GenericRepository<Ingredient> genericRepo = new GenericRepository<>();
        for (Ingredient item : service.getAllIngredients()) {
            genericRepo.add(item);
        }
        System.out.println("   Generic Repository size: " + genericRepo.size());
        System.out.println("   Total valuation computed via bounded method: ₹" + String.format("%.2f", genericRepo.calculateTotalRepositoryCost()));

        // File I/O: CSV Export and Import using BufferedReader & BufferedWriter
        System.out.println("4. Java I/O Streams (Character Streams: BufferedReader/BufferedWriter):");
        File csvFile = new File("scratch_inventory_demo.csv");
        CsvExporter csvExporter = new CsvExporter();
        try {
            csvExporter.exportInventoryToCsv(service.getAllIngredients(), csvFile);
            System.out.println("   Exported " + service.getAllIngredients().size() + " items to CSV: " + csvFile.getName());

            List<Ingredient> imported = csvExporter.importInventoryFromCsv(csvFile);
            System.out.println("   Successfully imported " + imported.size() + " items back from CSV.");
        } catch (Exception e) {
            System.err.println("   CSV I/O error: " + e.getMessage());
        } finally {
            if (csvFile.exists()) csvFile.delete(); // cleanup scratch file
        }

        // Object Serialization and Deserialization using ObjectOutputStream & ObjectInputStream
        System.out.println("5. Object Serialization & Deserialization (ObjectOutputStream/ObjectInputStream):");
        File serFile = new File("scratch_state_demo.ser");
        AppStateSerializer serializer = new AppStateSerializer();
        try {
            AppStateSerializer.KitchenStateBundle bundle = new AppStateSerializer.KitchenStateBundle(
                    service.getAllIngredients(), new ArrayList<>(), new ArrayList<>()
            );
            serializer.serializeState(bundle, serFile);
            System.out.println("   Serialized state bundle to binary file: " + serFile.getName() + " (" + serFile.length() + " bytes)");

            AppStateSerializer.KitchenStateBundle restored = serializer.deserializeState(serFile);
            System.out.println("   Deserialized state bundle successfully. Restored items count: " + restored.getIngredients().size());
        } catch (Exception e) {
            System.err.println("   Serialization error: " + e.getMessage());
        } finally {
            if (serFile.exists()) serFile.delete(); // cleanup scratch file
        }

        // Lambdas and Streams
        System.out.println("6. Lambda Expressions and Streams:");
        List<Ingredient> lowStock = service.getLowStockIngredients();
        System.out.println("   Low stock items found: " + lowStock.size());
        double totalVal = service.calculateTotalInventoryValue();
        System.out.println("   Total pantry inventory value: ₹" + String.format("%.2f", totalVal));
    }
}
