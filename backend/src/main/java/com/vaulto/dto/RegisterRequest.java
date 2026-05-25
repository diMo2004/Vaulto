package com.vaulto.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String password;
    private String dob;
    private String gender;
    private String username;
    private String name;
}
