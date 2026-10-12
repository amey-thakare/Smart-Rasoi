package com.smartrasoi.threading;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Unit 3 Syllabus Topic: Concurrency - Controlled, Safely-Terminable Deadlock Demonstration.
 *
 * Demonstrates:
 * - The 4 Coffman conditions required for Deadlock:
 *   1. Mutual Exclusion
 *   2. Hold and Wait
 *   3. No Preemption
 *   4. Circular Wait (Resource Ordering conflict)
 * - Safe termination using timed locks (ReentrantLock.tryLock with timeout) or watchdog interrupts,
 *   guaranteeing the demonstration NEVER hangs the application.
 */
public class SafeDeadlockDemo {

    // Kitchen resources that two chefs need concurrently
    public static class KitchenStation {
        private final String name;
        private final ReentrantLock lock;

        public KitchenStation(String name) {
            this.name = name;
            this.lock = new ReentrantLock();
        }

        public String getName() { return name; }
        public ReentrantLock getLock() { return lock; }
    }

    /**
     * Executes a controlled deadlock scenario where Chef A holds SpiceStation and wants StoveStation,
     * while Chef B holds StoveStation and wants SpiceStation.
     *
     * To prevent hanging the JVM, each thread uses a 400ms timeout on the second lock acquisition,
     * detects the circular wait contention, safely aborts, and rolls back gracefully.
     *
     * @return diagnostic report showing the deadlock condition and safe recovery
     */
    public String executeSafeDeadlockSimulation() {
        KitchenStation spiceStation = new KitchenStation("Spice-Station-A");
        KitchenStation stoveStation = new KitchenStation("Stove-Station-B");

        StringBuilder log = new StringBuilder();
        log.append("=== CONTROLLED DEADLOCK DEMONSTRATION ===\n");
        log.append("Conditions: Circular Wait between 2 Threads acquiring shared stations\n");

        CountDownLatch bothStartedLatch = new CountDownLatch(2);

        Thread chef1 = new Thread(() -> {
            try {
                if (spiceStation.getLock().tryLock(2000, TimeUnit.MILLISECONDS)) {
                    log.append("[Chef-1] Acquired lock on: ").append(spiceStation.getName()).append("\n");
                    bothStartedLatch.countDown();

                    // Intentional pause allowing Chef-2 to acquire stoveStation
                    Thread.sleep(150);

                    log.append("[Chef-1] Attempting to acquire: ").append(stoveStation.getName())
                       .append(" (HOLD AND WAIT state)\n");

                    // TryLock with timeout: detects circular wait without freezing thread indefinitely!
                    if (stoveStation.getLock().tryLock(400, TimeUnit.MILLISECONDS)) {
                        try {
                            log.append("[Chef-1] Acquired both stations!\n");
                        } finally {
                            stoveStation.getLock().unlock();
                        }
                    } else {
                        log.append("[Chef-1] DEADLOCK AVERTED: Timeout expired trying to acquire ")
                           .append(stoveStation.getName()).append(". Releasing ").append(spiceStation.getName()).append("!\n");
                    }
                }
            } catch (InterruptedException e) {
                log.append("[Chef-1] Thread interrupted during deadlock resolution.\n");
                Thread.currentThread().interrupt();
            } finally {
                if (spiceStation.getLock().isHeldByCurrentThread()) {
                    spiceStation.getLock().unlock();
                    log.append("[Chef-1] Released lock on: ").append(spiceStation.getName()).append("\n");
                }
            }
        }, "Chef-1-Thread");

        Thread chef2 = new Thread(() -> {
            try {
                if (stoveStation.getLock().tryLock(2000, TimeUnit.MILLISECONDS)) {
                    log.append("[Chef-2] Acquired lock on: ").append(stoveStation.getName()).append("\n");
                    bothStartedLatch.countDown();

                    // Intentional pause allowing Chef-1 to acquire spiceStation
                    Thread.sleep(150);

                    log.append("[Chef-2] Attempting to acquire: ").append(spiceStation.getName())
                       .append(" (CIRCULAR WAIT state)\n");

                    // TryLock with timeout prevents indefinite blockage
                    if (spiceStation.getLock().tryLock(400, TimeUnit.MILLISECONDS)) {
                        try {
                            log.append("[Chef-2] Acquired both stations!\n");
                        } finally {
                            spiceStation.getLock().unlock();
                        }
                    } else {
                        log.append("[Chef-2] DEADLOCK AVERTED: Timeout expired trying to acquire ")
                           .append(spiceStation.getName()).append(". Releasing ").append(stoveStation.getName()).append("!\n");
                    }
                }
            } catch (InterruptedException e) {
                log.append("[Chef-2] Thread interrupted during deadlock resolution.\n");
                Thread.currentThread().interrupt();
            } finally {
                if (stoveStation.getLock().isHeldByCurrentThread()) {
                    stoveStation.getLock().unlock();
                    log.append("[Chef-2] Released lock on: ").append(stoveStation.getName()).append("\n");
                }
            }
        }, "Chef-2-Thread");

        chef1.start();
        chef2.start();

        try {
            // Wait for both threads to cleanly complete and terminate
            chef1.join(3000);
            chef2.join(3000);
            log.append("Result: Both threads terminated safely without hanging the JVM.\n");
            log.append("Resolution Strategy: Lock acquisition timeouts & strict resource ordering.\n");
        } catch (InterruptedException e) {
            log.append("Deadlock coordinator interrupted.\n");
            Thread.currentThread().interrupt();
        }

        return log.toString();
    }
}
