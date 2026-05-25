package com.vaulto.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    @JsonProperty("_id")
    private String id;
    
    private String provider; // "local", "google", "phone"
    private String email;
    private String password;
    private String phone;
    
    private String name;
    private String username;
    private String dob;
    private String gender;
    
    private String googleId;
    private String avatar;
    
    private String refreshToken;
    
    private Map<String, Integer> categoryUsage;
    private String preferenceCluster;
    
    @CreatedDate
    private Instant createdAt;
    
    @LastModifiedDate
    private Instant updatedAt;
}
