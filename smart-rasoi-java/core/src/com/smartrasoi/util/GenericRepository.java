package com.smartrasoi.util;

import com.smartrasoi.model.KitchenItem;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.Predicate;

/**
 * Unit 4 Syllabus Topic: Generics and Bounded Type Parameters.
 *
 * Demonstrates:
 * - Generic class with bounded type parameters: <T extends KitchenItem & CostCalculable>
 * - Multiple bounds (Class bound must come first, followed by interface bound with &)
 * - Type-safe generic storage and retrieval
 * - Generic methods with independent type parameters: <R> List<R> transform(...)
 * - Use of standard functional interfaces (Predicate, Function)
 */
public class GenericRepository<T extends KitchenItem & CostCalculable> {

    private final List<T> storage;

    public GenericRepository() {
        this.storage = new ArrayList<>();
    }

    public void add(T item) {
        if (item != null) {
            storage.add(item);
        }
    }

    public boolean remove(T item) {
        return storage.remove(item);
    }

    public Optional<T> findById(String id) {
        if (id == null) return Optional.empty();
        return storage.stream()
                .filter(item -> id.equals(item.getId()))
                .findFirst();
    }

    public List<T> findAll() {
        return Collections.unmodifiableList(storage);
    }

    /**
     * Filters stored items using a Predicate lambda.
     */
    public List<T> filter(Predicate<T> condition) {
        List<T> result = new ArrayList<>();
        for (T item : storage) {
            if (condition.test(item)) {
                result.add(item);
            }
        }
        return result;
    }

    /**
     * Calculates the aggregate inventory cost of all items in this generic repository.
     * Guaranteed to compile safely because T is bounded by CostCalculable.
     */
    public double calculateTotalRepositoryCost() {
        double sum = 0.0;
        for (T item : storage) {
            sum += item.calculateTotalCost();
        }
        return sum;
    }

    /**
     * Demonstrates: Generic Method with its own type parameter <R>.
     *
     * @param mapper function mapping from T to R
     * @param <R> the return type of the transformation
     * @return list of transformed elements
     */
    public <R> List<R> map(Function<T, R> mapper) {
        List<R> mapped = new ArrayList<>();
        for (T item : storage) {
            mapped.add(mapper.apply(item));
        }
        return mapped;
    }

    public int size() {
        return storage.size();
    }

    public void clear() {
        storage.clear();
    }
}
