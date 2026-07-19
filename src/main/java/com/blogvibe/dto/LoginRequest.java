package com.blogvibe.dto;

import lombok.*;
import jakarta.validation.constraints.*;

@Data @AllArgsConstructor @NoArgsConstructor
public class LoginRequest {
    @Email @NotBlank
    public String email;

    @NotBlank
    public String password;
}
