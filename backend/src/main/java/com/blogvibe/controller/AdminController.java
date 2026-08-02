package com.blogvibe.controller;

import com.blogvibe.dto.AdminStatsDto;
import com.blogvibe.dto.MessageResponse;
import com.blogvibe.dto.PostSummaryDto;
import com.blogvibe.dto.UserDto;
import com.blogvibe.model.BlogModeration;
import com.blogvibe.model.Role;
import com.blogvibe.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getStats() {
        return ResponseEntity.ok(adminService.getAdminStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getUsers(@RequestParam(required = false) String query) {
        return ResponseEntity.ok(adminService.getAllUsers(query));
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<UserDto> updateUserRole(@PathVariable Long id, @RequestParam Role role) {
        return ResponseEntity.ok(adminService.updateUserRole(id, role));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<UserDto> updateUserStatus(@PathVariable Long id, @RequestParam Boolean banned) {
        return ResponseEntity.ok(adminService.updateUserStatus(id, banned));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<MessageResponse> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(new MessageResponse("User deleted successfully"));
    }

    @GetMapping("/posts")
    public ResponseEntity<List<PostSummaryDto>> getPosts() {
        return ResponseEntity.ok(adminService.getAllPosts());
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<MessageResponse> deletePost(@PathVariable Long id) {
        adminService.deletePost(id);
        return ResponseEntity.ok(new MessageResponse("Post deleted successfully"));
    }

    @GetMapping("/moderation-logs")
    public ResponseEntity<List<BlogModeration>> getModerationLogs() {
        return ResponseEntity.ok(adminService.getModerationLogs());
    }
}
