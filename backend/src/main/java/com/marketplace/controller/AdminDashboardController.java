package com.marketplace.controller;

import com.marketplace.dto.AdminDashboardResponse;
import com.marketplace.dto.SellerDto;
import com.marketplace.entity.SellerStatus;
import com.marketplace.service.AdminDashboardService;
import com.marketplace.service.SellerService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;
    private final SellerService sellerService;

    public AdminDashboardController(AdminDashboardService adminDashboardService, SellerService sellerService) {
        this.adminDashboardService = adminDashboardService;
        this.sellerService = sellerService;
    }

    /**
     * Get snapshot of current dashboard metrics via concurrent aggregation.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardResponse> getDashboardMetrics() {
        return ResponseEntity.ok(adminDashboardService.getDashboardMetrics());
    }

    /**
     * Real-time Server-Sent Events (SSE) stream for live dashboard syncing.
     */
    @GetMapping(value = "/dashboard/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamDashboardUpdates() {
        return adminDashboardService.subscribe();
    }

    /**
     * Trigger manual concurrent refresh and broadcast to all connected dashboards.
     */
    @PostMapping("/dashboard/sync")
    public ResponseEntity<AdminDashboardResponse> triggerManualSync() {
        adminDashboardService.broadcastChange("MANUAL_SYNC", "Manual concurrent dashboard refresh triggered by admin.");
        return ResponseEntity.ok(adminDashboardService.getDashboardMetrics());
    }

    /**
     * Simulate high-concurrency background workload across worker threads.
     */
    @PostMapping("/dashboard/simulate-concurrency")
    public ResponseEntity<Map<String, Object>> simulateConcurrency(
            @RequestParam(defaultValue = "10") int threads) {
        return ResponseEntity.ok(adminDashboardService.simulateConcurrentWorkload(threads));
    }

    /**
     * Admin action to approve or change a seller's status, instantly syncing live metrics.
     */
    @RequestMapping(value = "/sellers/{sellerId}/status", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<SellerDto> updateSellerStatus(
            @PathVariable Long sellerId,
            @RequestParam SellerStatus status) {
        SellerDto updated = sellerService.updateSellerStatus(sellerId, status);
        adminDashboardService.broadcastChange(
                "SELLER_STATUS_CHANGED",
                "Seller '" + updated.businessName() + "' (ID: #" + updated.id() + ") status changed to " + status
        );
        return ResponseEntity.ok(updated);
    }
}
