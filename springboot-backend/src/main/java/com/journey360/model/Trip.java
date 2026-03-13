package com.journey360.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "trips")
public class Trip {

    @Id
    private String id;

    @Field("trip_id")
    private String tripId;

    @Field("user_id")
    private String userId;

    private String destination;

    @Field("start_date")
    private String startDate;

    @Field("end_date")
    private String endDate;

    private int days;
    private int budget;

    @Field("budget_level")
    @Builder.Default
    private String budgetLevel = "Balanced";

    private List<String> interests;

    @Field("travel_pace")
    @Builder.Default
    private String travelPace = "Balanced";

    @Builder.Default
    private String status = "CREATED";

    @Field("image_url")
    private String imageUrl;
}
