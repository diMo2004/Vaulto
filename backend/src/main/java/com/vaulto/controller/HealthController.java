package com.vaulto.controller;

import com.vaulto.service.OcrService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @Autowired
    private OcrService ocrService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "vaulto-backend"));
    }

    /** Wakes the (free-tier, sleeping) OCR service. The React scan pages call this when they open. */
    @GetMapping("/health/ocr")
    public ResponseEntity<Map<String, String>> ocrHealth() {
        boolean up = ocrService.warmUp();
        return ResponseEntity.ok(Map.of("ocr", up ? "up" : "waking"));
    }
}
