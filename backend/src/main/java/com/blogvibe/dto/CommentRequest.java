package com.blogvibe.dto;
import lombok.*;
import jakarta.validation.constraints.*;
@Data @AllArgsConstructor @NoArgsConstructor
public class CommentRequest { @NotBlank public String content; public Long parentId; }
