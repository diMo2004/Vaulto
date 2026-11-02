package com.vaulto.service;

import com.vaulto.dto.CouponRequest;
import com.vaulto.dto.GiftRequest;
import com.vaulto.dto.TradeRequest;
import com.vaulto.model.Coupon;
import com.vaulto.model.User;
import com.vaulto.repository.CouponRepository;
import com.vaulto.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CouponService {

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private UserRepository userRepository;

    @Value("${app.recommendation.service-url:${RECOMMENDATION_SERVICE_URL:https://vaulto-recommendation.onrender.com}}")
    private String recommendationServiceUrl;

    private final RestTemplate recRestTemplate = createRecRestTemplate();

    private static RestTemplate createRecRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(8_000);
        factory.setReadTimeout(12_000);
        return new RestTemplate(factory);
    }

    public Coupon addCoupon(String userId, CouponRequest request) {
        if (request.getStore() == null || request.getDiscount() == null) {
            throw new RuntimeException("Store and discount are required");
        }

        Coupon coupon = Coupon.builder()
                .owner(userId)
                .store(request.getStore())
                .code(request.getCode())
                .category(request.getCategory())
                .discount(request.getDiscount())
                .expiry(request.getExpiry())
                .rawText(request.getRawText())
                .image(request.getImage())
                .giftedFrom(request.getGiftedFrom())
                .isGifted(request.getGiftedFrom() != null)
                .isTradable(false)
                .usageCount(0)
                .build();

        Coupon saved = couponRepository.save(coupon);
        syncCouponToRecommendationService(saved);
        return saved;
    }

    public List<Coupon> getAllCoupons(String userId) {
        return couponRepository.findByOwnerOrderByCreatedAtDesc(userId);
    }

    public List<Coupon> getTradeableCoupons(String userId) {
        return couponRepository.findByOwnerAndIsTradableTrueAndIsGiftedFalse(userId);
    }

    public Coupon toggleTradable(String userId, String couponId, TradeRequest request) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));

        if (!coupon.getOwner().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        coupon.setTradable(!coupon.isTradable());
        if (request != null && request.getTradeNotes() != null) {
            coupon.setTradeNotes(request.getTradeNotes());
        }

        return couponRepository.save(coupon);
    }

    public Coupon giftCoupon(String userId, GiftRequest request) {
        Coupon originalCoupon = couponRepository.findById(request.getCouponId())
                .orElseThrow(() -> new RuntimeException("Coupon not found"));

        if (!originalCoupon.getOwner().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        User recipient = userRepository.findByEmail(request.getRecipientEmail())
                .orElseThrow(() -> new RuntimeException("Recipient not found"));

        if (recipient.getId().equals(userId)) {
            throw new RuntimeException("Cannot gift to yourself");
        }

        originalCoupon.setGiftedTo(recipient.getId());
        originalCoupon.setTradable(false);
        couponRepository.save(originalCoupon);

        Coupon newCoupon = Coupon.builder()
                .owner(recipient.getId())
                .store(originalCoupon.getStore())
                .code(originalCoupon.getCode())
                .category(originalCoupon.getCategory())
                .discount(originalCoupon.getDiscount())
                .expiry(originalCoupon.getExpiry())
                .rawText(originalCoupon.getRawText())
                .image(originalCoupon.getImage())
                .giftedFrom(userId)
                .isGifted(true)
                .isTradable(false)
                .usageCount(0)
                .build();

        return couponRepository.save(newCoupon);
    }

    public Coupon useCoupon(String userId, String couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));

        if (!coupon.getOwner().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        int count = coupon.getUsageCount() == null ? 0 : coupon.getUsageCount();
        coupon.setUsageCount(count + 1);
        coupon.setLastUsedAt(new Date());

        return couponRepository.save(coupon);
    }

    public List<Coupon> getExpiringSoon(String userId, int days) {
        List<Coupon> allCoupons = couponRepository.findByOwnerOrderByCreatedAtDesc(userId);
        long now = System.currentTimeMillis();
        long threshold = now + ((long) days * 24 * 60 * 60 * 1000);

        return allCoupons.stream()
                .filter(c -> c.getExpiry() != null && c.getExpiry().getTime() > now && c.getExpiry().getTime() <= threshold)
                .collect(Collectors.toList());
    }

    public void deleteCoupon(String userId, String couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));

        if (!coupon.getOwner().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        couponRepository.delete(coupon);
    }

    public List<?> getRecommendedCoupons(String userId, int limit) {
        if (recommendationServiceUrl != null && !recommendationServiceUrl.isBlank()) {
            try {
                String baseUrl = recommendationServiceUrl.replaceAll("/+$", "");
                String targetUid = (userId != null && !userId.isBlank() && !userId.equals("default")) ? userId : "1";
                String url = baseUrl + "/recommendations/" + targetUid + "?top_k=" + limit;
                ResponseEntity<Map> resp = recRestTemplate.getForEntity(url, Map.class);
                if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                    Object recs = resp.getBody().get("recommendations");
                    if (recs instanceof List && !((List<?>) recs).isEmpty()) {
                        return (List<?>) recs;
                    }
                }
            } catch (Exception e) {
                // Graceful fallback if recommendation service is asleep or cold-starting
                System.err.println("Recommendation service fallback: " + e.getMessage());
            }
        }
        return getAllCoupons(userId);
    }

    private void syncCouponToRecommendationService(Coupon saved) {
        try {
            if (recommendationServiceUrl != null && !recommendationServiceUrl.isBlank()) {
                String baseUrl = recommendationServiceUrl.replaceAll("/+$", "");
                Map<String, Object> payload = new HashMap<>();
                payload.put("store", saved.getStore());
                payload.put("category", saved.getCategory() != null ? saved.getCategory() : "Other");
                payload.put("description", saved.getStore() + " - " + (saved.getDiscount() != null ? saved.getDiscount() : "offer"));
                double discountVal = 15.0;
                if (saved.getDiscount() != null) {
                    try {
                        String num = saved.getDiscount().replaceAll("[^0-9.]", "");
                        if (!num.isBlank()) discountVal = Double.parseDouble(num);
                    } catch (Exception ignored) {}
                }
                payload.put("discount", discountVal);
                payload.put("tags", saved.getCategory() != null ? saved.getCategory() : "deal");
                recRestTemplate.postForEntity(baseUrl + "/coupons", payload, String.class);
            }
        } catch (Exception ignored) {
            // Best effort async sync
        }
    }
}
