package com.smartrasoi.controller;

import com.smartrasoi.entity.InventoryItem;
import com.smartrasoi.entity.User;
import com.smartrasoi.repository.InventoryItemRepository;
import com.smartrasoi.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
public class InventoryController {

    private final InventoryItemRepository inventoryRepository;
    private final UserRepository userRepository;

    public InventoryController(InventoryItemRepository inventoryRepository, UserRepository userRepository) {
        this.inventoryRepository = inventoryRepository;
        this.userRepository = userRepository;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName()).orElseThrow();
    }

    @GetMapping
    public List<InventoryItem> getInventory() {
        User user = getCurrentUser();
        return inventoryRepository.findByUserId(user.getId());
    }

    @PostMapping
    public InventoryItem addItem(@RequestBody InventoryItem item) {
        item.setUser(getCurrentUser());
        return inventoryRepository.save(item);
    }
    
    @PostMapping("/{id}/consume")
    public ResponseEntity<?> consumeItem(@PathVariable Long id) {
        InventoryItem item = inventoryRepository.findById(id).orElseThrow();
        if(!item.getUser().getId().equals(getCurrentUser().getId())) {
             return ResponseEntity.status(403).build();
        }
        item.setConsumed(true);
        inventoryRepository.save(item);
        return ResponseEntity.ok().build();
    }
}
