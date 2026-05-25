package com.vaulto.dto;

import com.vaulto.model.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponse {
    private String id;
    private String email;
    private String name;
    private String username;
    private String dob;
    private String gender;
    private String avatar;
    private String provider;
    private String phone;

    public static UserResponse fromUser(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .username(user.getUsername())
                .dob(user.getDob())
                .gender(user.getGender())
                .avatar(user.getAvatar())
                .provider(user.getProvider())
                .phone(user.getPhone())
                .build();
    }
}
