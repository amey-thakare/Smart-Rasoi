package com.smartrasoi.controller;

import com.smartrasoi.entity.Recipe;
import com.smartrasoi.repository.RecipeRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recipes")
public class RecipeController {

    private final RecipeRepository recipeRepository;

    public RecipeController(RecipeRepository recipeRepository) {
        this.recipeRepository = recipeRepository;
    }

    @GetMapping
    public List<Recipe> getAllRecipes() {
        return recipeRepository.findAll();
    }

    @PostMapping
    public Recipe addRecipe(@RequestBody Recipe recipe) {
        return recipeRepository.save(recipe);
    }
    
    @GetMapping("/{id}")
    public Recipe getRecipe(@PathVariable Long id) {
        return recipeRepository.findById(id).orElseThrow();
    }
}
