
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        System.out.println("================================");
        System.out.println("       SMART RASOI - JAVA");
        System.out.println("================================");
        System.out.println("1. View Inventory");
        System.out.println("2. View Recipe Suggestions");
        System.out.println("3. Demonstrate OOP");
        System.out.println("4. Demonstrate Collections");
        System.out.println("5. Demonstrate Exception Handling");
        System.out.println("6. Exit");
        System.out.print("Choose an option: ");

        int choice = sc.nextInt();

        switch (choice) {
            case 1 -> System.out.println(
                "Inventory: Rice, Potato, Tomato, Onion"
            );
            case 2 -> System.out.println(
                "Suggested recipe: Aloo Tomato Curry"
            );
            case 3 -> System.out.println(
                "OOP: Classes, Objects, Inheritance, Polymorphism"
            );
            case 4 -> {
                List<String> items = new ArrayList<>(
                    List.of("Rice", "Potato", "Tomato")
                );
                System.out.println("Inventory items: " + items);
            }
            case 5 -> {
                try {
                    int result = 10 / 0;
                } catch (ArithmeticException e) {
                    System.out.println(
                        "Exception handled: " + e.getMessage()
                    );
                }
            }
            case 6 -> System.out.println("Exiting Smart Rasoi Java Demo.");
            default -> System.out.println("Invalid option.");
        }

        sc.close();
    }
}
