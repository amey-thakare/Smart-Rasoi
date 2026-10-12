package com.smartrasoi.serialization;

import com.smartrasoi.model.Category;
import com.smartrasoi.model.Ingredient;
import java.io.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Unit 4 Syllabus Topic: Java I/O Streams, File Reading & Writing.
 *
 * Demonstrates:
 * - Character streams: FileReader, FileWriter
 * - Buffered I/O: BufferedReader, BufferedWriter
 * - Automatic resource cleanup using try-with-resources (AutoCloseable)
 * - Parsing delimited records (CSV export and import)
 * - Exception handling during disk I/O operations (IOException)
 */
public class CsvExporter {

    private static final String CSV_HEADER = "id,name,category,quantity,unit,minThreshold,unitPrice,expiryDate,location";

    /**
     * Exports a list of pantry ingredients to a CSV text file.
     * Demonstrates: BufferedWriter and FileWriter with try-with-resources.
     *
     * @param ingredients list of items to export
     * @param outputFile destination file
     * @throws IOException if disk write fails
     */
    public void exportInventoryToCsv(List<Ingredient> ingredients, File outputFile) throws IOException {
        if (outputFile.getParentFile() != null && !outputFile.getParentFile().exists()) {
            outputFile.getParentFile().mkdirs();
        }

        // Try-with-resources: automatically flushes and closes streams even if exceptions occur
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(outputFile))) {
            writer.write(CSV_HEADER);
            writer.newLine();

            for (Ingredient item : ingredients) {
                String line = String.format("%s,%s,%s,%.2f,%s,%.2f,%.2f,%s,%s",
                        escapeCsv(item.getId()),
                        escapeCsv(item.getName()),
                        item.getCategory().name(),
                        item.getQuantity(),
                        escapeCsv(item.getUnit()),
                        item.getMinThreshold(),
                        item.getUnitPrice(),
                        item.getExpiryDate() != null ? item.getExpiryDate().toString() : "",
                        escapeCsv(item.getLocation())
                );
                writer.write(line);
                writer.newLine();
            }
        }
    }

    /**
     * Imports and parses ingredients from a CSV file.
     * Demonstrates: BufferedReader and FileReader with line-by-line reading.
     *
     * @param inputFile CSV file to read
     * @return parsed list of Ingredient objects
     * @throws IOException if file reading fails
     */
    public List<Ingredient> importInventoryFromCsv(File inputFile) throws IOException {
        List<Ingredient> imported = new ArrayList<>();

        if (!inputFile.exists()) {
            throw new FileNotFoundException("Inventory file does not exist: " + inputFile.getAbsolutePath());
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(inputFile))) {
            String line = reader.readLine(); // Read header line
            if (line == null) {
                return imported;
            }

            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] parts = line.split(",", -1);
                if (parts.length >= 7) {
                    String id = parts[0].trim();
                    String name = parts[1].trim();
                    Category category = Category.fromString(parts[2].trim());
                    double quantity = parseDoubleSafe(parts[3]);
                    String unit = parts[4].trim();
                    double minThreshold = parseDoubleSafe(parts[5]);
                    double unitPrice = parseDoubleSafe(parts[6]);

                    LocalDate expiryDate = null;
                    if (parts.length > 7 && !parts[7].trim().isEmpty()) {
                        try {
                            expiryDate = LocalDate.parse(parts[7].trim());
                        } catch (Exception ignored) {}
                    }

                    String location = (parts.length > 8 && !parts[8].trim().isEmpty()) ? parts[8].trim() : "Pantry";

                    Ingredient item = new Ingredient(id, name, category, quantity, unit,
                            minThreshold, unitPrice, expiryDate, location);
                    imported.add(item);
                }
            }
        }

        return imported;
    }

    private double parseDoubleSafe(String val) {
        try {
            return Double.parseDouble(val.trim());
        } catch (Exception e) {
            return 0.0;
        }
    }

    private String escapeCsv(String str) {
        if (str == null) return "";
        return str.replace(",", " ");
    }
}
