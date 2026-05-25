package com.vaulto.dto;

import lombok.Data;

import java.util.Date;

@Data
public class CouponRequest {
    private String store;
    private String code;
    private Date expiry;
    private String discount;
    private String category;
    private String rawText;
    private String image;
    private String giftedFrom;
}
