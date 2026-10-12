package com.smartrasoi.serialization;

import com.smartrasoi.model.Ingredient;
import com.smartrasoi.model.Recipe;
import com.smartrasoi.model.ShoppingList;
import java.io.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Unit 4 Syllabus Topic: Object Serialization & Deserialization.
 *
 * Demonstrates:
 * - Byte streams: FileInputStream and FileOutputStream
 * - Object streams: ObjectInputStream and ObjectOutputStream
 * - Serializing complete object graphs to binary disk files
 * - Deserializing persisted domain states
 * - Security best practice: safe path validation and strict class checking
 */
public class AppStateSerializer {

    /**
     * Serializable container bundling application state for persistence.
     */
    public static class KitchenStateBundle implements Serializable {
        private static final long serialVersionUID = 1L;

        private final long timestamp;
        private final List<Ingredient> ingredients;
        private final List<Recipe> recipes;
        private final List<ShoppingList> shoppingLists;

        public KitchenStateBundle(List<Ingredient> ingredients, List<Recipe> recipes, List<ShoppingList> shoppingLists) {
            this.timestamp = System.currentTimeMillis();
            this.ingredients = (ingredients != null) ? new ArrayList<>(ingredients) : new ArrayList<>();
            this.recipes = (recipes != null) ? new ArrayList<>(recipes) : new ArrayList<>();
            this.shoppingLists = (shoppingLists != null) ? new ArrayList<>(shoppingLists) : new ArrayList<>();
        }

        public long getTimestamp() { return timestamp; }
        public List<Ingredient> getIngredients() { return ingredients; }
        public List<Recipe> getRecipes() { return recipes; }
        public List<ShoppingList> getShoppingLists() { return shoppingLists; }
    }

    /**
     * Serializes kitchen state bundle to a binary file.
     * Demonstrates ObjectOutputStream and FileOutputStream with try-with-resources.
     *
     * @param bundle state to serialize
     * @param destinationFile target binary file
     * @throws IOException on serialization failure
     */
    public void serializeState(KitchenStateBundle bundle, File destinationFile) throws IOException {
        if (destinationFile.getParentFile() != null && !destinationFile.getParentFile().exists()) {
            destinationFile.getParentFile().mkdirs();
        }

        try (FileOutputStream fos = new FileOutputStream(destinationFile);
             ObjectOutputStream oos = new ObjectOutputStream(fos)) {
            oos.writeObject(bundle);
            oos.flush();
        }
    }

    /**
     * Safely deserializes kitchen state bundle from trusted local file.
     * Demonstrates ObjectInputStream and FileInputStream.
     *
     * @param sourceFile binary file to read
     * @return deserialized KitchenStateBundle
     * @throws IOException on I/O error
     * @throws ClassNotFoundException if serialized class definition not found in classpath
     */
    public KitchenStateBundle deserializeState(File sourceFile) throws IOException, ClassNotFoundException {
        if (!sourceFile.exists()) {
            throw new FileNotFoundException("State snapshot file not found: " + sourceFile.getAbsolutePath());
        }

        try (FileInputStream fis = new FileInputStream(sourceFile);
             ObjectInputStream ois = new ObjectInputStream(fis)) {
            Object obj = ois.readObject();
            if (obj instanceof KitchenStateBundle) {
                return (KitchenStateBundle) obj;
            } else {
                throw new InvalidClassException("Unexpected object type inside serialized stream: " + obj.getClass());
            }
        }
    }
}
