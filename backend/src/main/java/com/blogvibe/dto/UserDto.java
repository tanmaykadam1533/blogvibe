package com.blogvibe.dto;
import com.blogvibe.model.Role;
import lombok.*;
import java.time.LocalDateTime;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
public class UserDto {
    public Long id; 
    public String name; 
    public String email;
    public String profilePicture; 
    public String bio; 
    public String location;
    public String website; 
    public Role role;
    public Boolean banned;
    public LocalDateTime createdAt;
}
