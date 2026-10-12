package com.smartrasoi.threading;

import com.smartrasoi.model.Ingredient;
import java.util.LinkedList;
import java.util.Queue;

/**
 * Unit 3 Syllabus Topic: Inter-Thread Communication using wait() and notifyAll().
 *
 * Demonstrates:
 * - Producer-Consumer pattern in a multi-threaded kitchen replenishment system
 * - Producer (Grocery Delivery) adds ingredients to replenishment queue
 * - Consumer (Kitchen Chef) consumes ingredients from queue
 * - wait() causes the current thread to release the lock and wait until notified
 * - notifyAll() wakes up all waiting threads
 * - Guarding conditions inside while loops (prevents spurious wakeups)
 */
public class SharedInventoryQueue {

    private final Queue<Ingredient> queue;
    private final int capacity;

    public SharedInventoryQueue(int capacity) {
        this.queue = new LinkedList<>();
        this.capacity = Math.max(1, capacity);
    }

    /**
     * Producer method: puts an ingredient into the kitchen queue.
     * If queue is full, calls wait() until chef consumes an item.
     */
    public synchronized void produceIngredient(Ingredient item) throws InterruptedException {
        // While loop guarding against spurious wakeups (Unit 3 Best Practice)
        while (queue.size() >= capacity) {
            // Queue is full; producer waits for chef to consume
            wait();
        }

        queue.add(item);
        // Wake up any waiting chef consumers
        notifyAll();
    }

    /**
     * Consumer method: takes an ingredient from the kitchen queue.
     * If queue is empty, calls wait() until delivery produces an item.
     */
    public synchronized Ingredient consumeIngredient() throws InterruptedException {
        while (queue.isEmpty()) {
            // Queue is empty; chef waits for delivery
            wait();
        }

        Ingredient item = queue.poll();
        // Wake up any waiting producers
        notifyAll();
        return item;
    }

    public synchronized int size() {
        return queue.size();
    }

    public synchronized boolean isEmpty() {
        return queue.isEmpty();
    }
}
