package com.blogvibe.dto;
import lombok.*;
@Data @AllArgsConstructor @NoArgsConstructor
public class ShareRequest { public Long postId; public Long recipientId; public String message; }
