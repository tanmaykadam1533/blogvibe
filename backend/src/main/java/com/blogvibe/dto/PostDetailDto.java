package com.blogvibe.dto;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
@Data @AllArgsConstructor @NoArgsConstructor
public class PostDetailDto {
    public Long id; public String title; public String content; public String summary;
    public String coverImage; public String category; public List<String> tags;
    public Long viewCount; public Long likeCount; public Long commentCount;
    public LocalDateTime createdAt; public LocalDateTime updatedAt;
    public AuthorDto author; public boolean liked; public String status; public List<String> imageUrls;
}
