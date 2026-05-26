package com.vaulto.controller;

import com.vaulto.dto.CouponRequest;
import com.vaulto.service.OcrService;
import com.vaulto.util.MetadataExtractor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/coupons")
public class OcrController {

    @Autowired
    private OcrService ocrService;

    @PostMapping("/ocr")
    public ResponseEntity<?> extractOcrMetadata(@RequestParam("image") MultipartFile image) {
        try {
            // 1. Get raw text from PaddleOCR microservice
            String rawText = ocrService.extractTextFromImage(image);
            
            // 2. Extract structured metadata using the MetadataExtractor
            CouponRequest metadata = MetadataExtractor.extractCouponData(rawText);
            
            // 3. Prepare response containing both raw text and parsed metadata
            Map<String, Object> response = new HashMap<>();
            response.put("rawText", rawText);
            response.put("metadata", metadata);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "OCR processing failed: " + e.getMessage()));
        }
    }
}
