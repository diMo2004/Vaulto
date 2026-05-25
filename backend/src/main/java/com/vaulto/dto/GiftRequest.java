package com.vaulto.dto;

import lombok.Data;

@Data
public class GiftRequest {
    private String couponId;
    private String recipientEmail;
}
