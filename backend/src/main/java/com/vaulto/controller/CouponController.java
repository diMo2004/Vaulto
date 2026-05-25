package com.vaulto.controller;

import com.vaulto.dto.CouponRequest;
import com.vaulto.dto.GiftRequest;
import com.vaulto.dto.MessageResponse;
import com.vaulto.dto.TradeRequest;
import com.vaulto.model.Coupon;
import com.vaulto.security.CustomUserDetails;
import com.vaulto.service.CouponService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/coupons")
public class CouponController {

    @Autowired
    private CouponService couponService;

    @PostMapping("/add")
    public ResponseEntity<?> addCoupon(@AuthenticationPrincipal CustomUserDetails userDetails, @RequestBody CouponRequest request) {
        try {
            Coupon coupon = couponService.addCoupon(userDetails.getId(), request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Coupon added", "coupon", coupon));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<Coupon>> getAllCoupons(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<Coupon> coupons = couponService.getAllCoupons(userDetails.getId());
        return ResponseEntity.ok(coupons);
    }

    @GetMapping("/tradeable")
    public ResponseEntity<List<Coupon>> getTradeableCoupons(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<Coupon> coupons = couponService.getTradeableCoupons(userDetails.getId());
        return ResponseEntity.ok(coupons);
    }

    @PostMapping("/{id}/tradable")
    public ResponseEntity<?> toggleTradable(@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable String id, @RequestBody(required = false) TradeRequest request) {
        try {
            Coupon coupon = couponService.toggleTradable(userDetails.getId(), id, request);
            return ResponseEntity.ok(Map.of("message", "Tradable status updated", "coupon", coupon));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/gift")
    public ResponseEntity<?> giftCoupon(@AuthenticationPrincipal CustomUserDetails userDetails, @RequestBody GiftRequest request) {
        try {
            Coupon coupon = couponService.giftCoupon(userDetails.getId(), request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Coupon gifted", "coupon", coupon));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/{id}/use")
    public ResponseEntity<?> useCoupon(@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable String id) {
        try {
            Coupon coupon = couponService.useCoupon(userDetails.getId(), id);
            return ResponseEntity.ok(coupon);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/expiring-soon")
    public ResponseEntity<List<Coupon>> getExpiringSoon(@AuthenticationPrincipal CustomUserDetails userDetails, @RequestParam(defaultValue = "3") int days) {
        List<Coupon> coupons = couponService.getExpiringSoon(userDetails.getId(), days);
        return ResponseEntity.ok(coupons);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCoupon(@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable String id) {
        try {
            couponService.deleteCoupon(userDetails.getId(), id);
            return ResponseEntity.ok(new MessageResponse("Coupon deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageResponse(e.getMessage()));
        }
    }
}
