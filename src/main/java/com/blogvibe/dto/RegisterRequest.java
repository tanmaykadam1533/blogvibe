package com.blogvibe.dto;

import lombok.*;
import jakarta.validation.constraints.*;

@Data @AllArgsConstructor @NoArgsConstructor
public class RegisterRequest {
    @NotBlank(message = "Name is required")
    public String name;

    @Email(message = "Valid email required")
    @NotBlank(message = "Email is required")
    public String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    public String password;
}
