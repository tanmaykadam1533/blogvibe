package com.blogvibe.dto;
import lombok.*;
import java.time.LocalDateTime;
@Data @AllArgsConstructor @NoArgsConstructor
public class ShareDto {
    public Long id; public String message; public boolean read;
    public LocalDateTime createdAt; public UserSummaryDto sender; public PostSharePreviewDto post;
}
