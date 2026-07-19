package com.blogvibe.dto;
import lombok.*;
import jakarta.validation.constraints.*;
import java.util.List;
@Data @AllArgsConstructor @NoArgsConstructor
public class CreatePostRequest {
    @NotBlank public String title;
    @NotBlank public String content;
    public String summary; public String category;
    public List<String> tags; public String coverImage; public boolean draft;
}
