package com.smartrasoi.threading;

import com.smartrasoi.model.Ingredient;
import com.smartrasoi.service.InventoryService;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Unit 3 Syllabus Topic: Multithreading - Implementing Runnable Interface.
 *
 * Demonstrates:
 * - Implementing java.lang.Runnable interface
 * - Decoupling task logic from Thread class hierarchy
 * - Passing Runnable to Thread constructor
 * - Thread synchronization using synchronized block
 */
public class InventorySyncRunnable implements Runnable {

    private final InventoryService inventoryService;
    private final Ingredient itemToSync;
    private final AtomicInteger syncSuccessCount;
    private volatile boolean completed;

    public InventorySyncRunnable(InventoryService inventoryService, Ingredient itemToSync, AtomicInteger counter) {
        this.inventoryService = inventoryService;
        this.itemToSync = itemToSync;
        this.syncSuccessCount = counter;
        this.completed = false;
    }

    @Override
    public void run() {
        try {
            // Simulate short network sync or file check
            Thread.sleep(60);

            // Synchronized block on inventoryService (Unit 3: Synchronization)
            synchronized (inventoryService) {
                inventoryService.addIngredient(itemToSync);
                syncSuccessCount.incrementAndGet();
            }

            this.completed = true;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    public boolean isCompleted() {
        return completed;
    }
}
