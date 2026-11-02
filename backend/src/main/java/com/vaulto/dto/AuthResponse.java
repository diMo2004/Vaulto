package com.vaulto.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String message;
    private UserResponse user;
    private String userId; // Some frontend flows expect just userId
    private String token;  // JWT access token for Authorization: Bearer header

    public AuthResponse(String message, UserResponse user, String userId) {
        this.message = message;
        this.user = user;
        this.userId = userId;
    }
}
