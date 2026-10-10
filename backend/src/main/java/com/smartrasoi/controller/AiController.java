package com.smartrasoi.controller;

import com.smartrasoi.ai.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
public class AiController {

    private final GeminiService geminiService;

    public AiController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> request) {
        String prompt = "You are a helpful culinary AI assistant named Smart Rasoi. User: " + request.get("prompt");
        String response = geminiService.generateContent(prompt);
        return ResponseEntity.ok(Map.of("response", response));
    }

    @PostMapping("/generate-recipe")
    public ResponseEntity<Map<String, String>> generateRecipe(@RequestBody Map<String, String> request) {
        String ingredients = request.get("ingredients");
        String prompt = "Act as a professional chef. Generate a creative recipe using these ingredients: " + ingredients + 
                ". Return ONLY a valid JSON object with the following fields: name (string), description (string), " +
                "cuisine (string), servings (number), prepTimeMinutes (number), cookTimeMinutes (number), " +
                "ingredients (array of strings), instructions (array of strings), dietaryTags (array of strings). Do not use markdown blocks like ```json.";
        String response = geminiService.generateContent(prompt);
        return ResponseEntity.ok(Map.of("response", response));
    }

    @PostMapping("/suggest-substitutes")
    public ResponseEntity<Map<String, String>> suggestSubstitutes(@RequestBody Map<String, String> request) {
        String ingredient = request.get("ingredient");
        String prompt = "What are the best culinary substitutes for: " + ingredient + 
                "? Return ONLY a valid JSON array of objects, each with fields: name (string), ratio (string, e.g. '1:1'), " +
                "notes (string). Do not use markdown blocks.";
        String response = geminiService.generateContent(prompt);
        return ResponseEntity.ok(Map.of("response", response));
    }

    @PostMapping("/waste-reduction")
    public ResponseEntity<Map<String, String>> wasteReduction(@RequestBody Map<String, String> request) {
        String items = request.get("items");
        String prompt = "Act as a zero-waste chef. I have these items that are expiring soon: " + items + 
                ". Suggest 3 quick meal ideas to use them up. Return ONLY a valid JSON array of objects, each with fields: " +
                "title (string), description (string), additionalIngredientsNeeded (array of strings). Do not use markdown blocks.";
        String response = geminiService.generateContent(prompt);
        return ResponseEntity.ok(Map.of("response", response));
    }
}
