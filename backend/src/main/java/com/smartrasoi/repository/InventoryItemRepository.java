package com.smartrasoi.repository;

import com.smartrasoi.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    List<InventoryItem> findByUserId(Long userId);
    List<InventoryItem> findByUserIdAndConsumedFalse(Long userId);
}
