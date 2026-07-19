package com.blogvibe.dto;
import lombok.*;
import java.time.LocalDateTime;
@Data @AllArgsConstructor @NoArgsConstructor
public class UserProfileDto {
    public Long id; public String name; public String email; public String profilePicture;
    public String bio; public String location; public String website;
    public LocalDateTime createdAt; public long postCount;
}
