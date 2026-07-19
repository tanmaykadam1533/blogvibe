package com.blogvibe.dto;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
@Data @AllArgsConstructor @NoArgsConstructor
public class CommentDto {
    public Long id; public String content; public LocalDateTime createdAt;
    public AuthorDto author; public List<CommentDto> replies;
}
