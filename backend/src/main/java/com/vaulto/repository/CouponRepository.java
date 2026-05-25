package com.vaulto.repository;

import com.vaulto.model.Coupon;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CouponRepository extends MongoRepository<Coupon, String> {
    List<Coupon> findByOwnerOrderByCreatedAtDesc(String owner);
    List<Coupon> findByOwnerAndIsTradableTrueAndIsGiftedFalse(String owner);
}
