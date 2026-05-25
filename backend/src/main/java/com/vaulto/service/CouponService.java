package com.vaulto.service;

import com.vaulto.dto.CouponRequest;
import com.vaulto.dto.GiftRequest;
import com.vaulto.dto.TradeRequest;
import com.vaulto.model.Coupon;
import com.vaulto.model.User;
import com.vaulto.repository.CouponRepository;
import com.vaulto.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CouponService {

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private UserRepository userRepository;

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

        return couponRepository.save(coupon);
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
}
