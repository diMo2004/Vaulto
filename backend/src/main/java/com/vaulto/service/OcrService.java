package com.vaulto.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@Service
public class OcrService {

    private final RestTemplate restTemplate = createRestTemplate();

    @Value("${app.ocr.service-url:${OCR_SERVICE_URL:http://localhost:8081/predict}}")
    private String ocrMicroserviceUrl;

    /** Timeouts so a dead/sleeping OCR service fails fast instead of hanging forever. */
    private static RestTemplate createRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(45_000);  // 45 s — covers free-tier cold start on Render
        factory.setReadTimeout(90_000);     // 90 s to OCR (covers free-tier cold starts)
        return new RestTemplate(factory);
    }

    public String getServiceUrl() {
        return ocrMicroserviceUrl;
    }

    /**
     * Pings the OCR service's /health endpoint so a sleeping free-tier instance starts waking up
     * before the user actually uploads an image. Never throws.
     */
    public boolean warmUp() {
        String url = ocrMicroserviceUrl.endsWith("/predict")
                ? ocrMicroserviceUrl.substring(0, ocrMicroserviceUrl.length() - "/predict".length()) + "/health"
                : ocrMicroserviceUrl;
        try {
            restTemplate.getForEntity(url, String.class);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private static final int MAX_ATTEMPTS = 3;

    public String extractTextFromImage(MultipartFile file) throws Exception {
        final byte[] bytes = file.getBytes();
        final String filename = file.getOriginalFilename() != null && !file.getOriginalFilename().isBlank()
                ? file.getOriginalFilename()
                : "image.jpg";

        // A free-tier Render service that is asleep answers 502/503 (or refuses the connection)
        // for the first ~30-60 s. Retry a few times instead of failing the user's scan.
        RestClientException lastError = null;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                return callOcrService(bytes, filename);
            } catch (ResourceAccessException | HttpServerErrorException e) {
                lastError = e;
                if (attempt < MAX_ATTEMPTS) {
                    Thread.sleep(attempt * 5000L); // 5 s, then 10 s
                }
            }
        }
        throw lastError;
    }

    private String callOcrService(byte[] bytes, final String filename) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        });

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> response = restTemplate.postForEntity(ocrMicroserviceUrl, requestEntity, Map.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            @SuppressWarnings("unchecked")
            Map<String, Object> responseBody = response.getBody();

            // Check "error" FIRST: the OCR service replies {"text": "", "error": "..."} on failure,
            // and returning the empty text would silently hide the real problem.
            Object error = responseBody.get("error");
            if (error != null && !String.valueOf(error).isBlank()) {
                throw new RuntimeException("OCR Microservice Error: " + error);
            }
            Object text = responseBody.get("text");
            if (text != null) {
                return String.valueOf(text);
            }
        }

        throw new RuntimeException("Failed to extract text from OCR microservice");
    }
}
