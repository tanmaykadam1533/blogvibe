package com.blogvibe.dto;
import lombok.*;
@Data @AllArgsConstructor @NoArgsConstructor
public class AuthResponse { public String token; public UserDto user; }
