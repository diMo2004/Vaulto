package com.vaulto.controller;

import com.vaulto.dto.CouponRequest;
import com.vaulto.service.OcrService;
import com.vaulto.util.MetadataExtractor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.multipart.MultipartFile;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/coupons")
public class OcrController {

    @Autowired
    private OcrService ocrService;

    @PostMapping("/ocr")
    public ResponseEntity<?> extractOcrMetadata(@RequestParam("image") MultipartFile image) {
        if (image == null || image.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "No image was uploaded."));
        }

        try {
            // 1. Get raw text from the OCR microservice
            String rawText = ocrService.extractTextFromImage(image);

            if (rawText == null || rawText.isBlank()) {
                return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                        .body(Map.of("message", "No text could be detected in this image. Try a clearer, well-lit picture."));
            }

            // 2. Extract structured metadata using the MetadataExtractor
            CouponRequest parsed = MetadataExtractor.extractCouponData(rawText);

            // The React form needs expiry as "yyyy-MM-dd" (<input type="date">), so build a plain map.
            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("store", parsed.getStore());
            metadata.put("code", parsed.getCode());
            metadata.put("discount", parsed.getDiscount());
            metadata.put("category", parsed.getCategory());
            metadata.put("expiry", MetadataExtractor.extractExpiry(rawText));
            metadata.put("rawText", rawText);

            // 3. Respond with both raw text and parsed metadata
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("rawText", rawText);
            response.put("metadata", metadata);

            return ResponseEntity.ok(response);

        } catch (ResourceAccessException e) {
            // Connection refused / timeout: the OCR microservice is not running or not reachable.
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "message", "The OCR service is not reachable at " + ocrService.getServiceUrl()
                            + ". If it is hosted on a free tier it may still be waking up - wait a minute and try again. "
                            + "Otherwise check that it is running and that OCR_SERVICE_URL is correct."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "OCR processing failed: " + e.getMessage()));
        }
    }
}
