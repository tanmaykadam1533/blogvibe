package com.blogvibe.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModerationResponse {
    private Boolean approved;
    private Integer confidence;
    private String reason;
    private Map<String, Boolean> categories;
}
