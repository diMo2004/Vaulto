package com.vaulto.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "coupons")
public class Coupon {

    @Id
    @JsonProperty("_id")
    private String id;
    
    @Field(targetType = FieldType.OBJECT_ID)
    private String owner;
    
    private String store;
    private String code;
    private String category;
    private String discount;
    private Date expiry;
    private String rawText;
    private String image;
    
    @Field(targetType = FieldType.OBJECT_ID)
    private String giftedFrom;
    
    private boolean isGifted;
    
    @Field(targetType = FieldType.OBJECT_ID)
    private String giftedTo;
    
    private boolean isTradable;
    private String tradeNotes;
    
    private Integer usageCount;
    private Date lastUsedAt;
    
    @CreatedDate
    private Instant createdAt;
    
    @LastModifiedDate
    private Instant updatedAt;
}
