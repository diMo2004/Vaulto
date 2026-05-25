package com.vaulto.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String name;
    private String username;
    private String dob;
    private String gender;
    private String email;
    private String avatar;
}
