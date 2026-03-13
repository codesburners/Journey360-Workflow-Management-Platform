package com.journey360.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "saved_places")
public class SavedPlace {

    @Id
    private String id;

    @Field("place_id")
    private String placeId;

    private String name;
    private String address;
    private String category;
    private Double rating;
    private String image;
    private String notes;
    private Double lat;
    private Double lng;

    @Field("saved_at")
    @Builder.Default
    private Date savedAt = new Date();

    @Field("user_id")
    private String userId;
}
