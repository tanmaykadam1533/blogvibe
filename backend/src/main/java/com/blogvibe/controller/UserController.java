package com.blogvibe.controller;

import com.blogvibe.dto.*;
import com.blogvibe.model.User;
import com.blogvibe.repository.*;
import com.blogvibe.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final FileStorageService fileStorageService;

    // ── Get user public profile ───────────────────────────────────────────────
    @GetMapping("/{id}/profile")
    public ResponseEntity<UserProfileDto> getProfile(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow();
        long postCount = postRepository.findByAuthorIdAndStatusOrderByCreatedAtDesc(
                id, com.blogvibe.model.Post.PostStatus.PUBLISHED,
                PageRequest.of(0, 1)).getTotalElements();

        return ResponseEntity.ok(new UserProfileDto(
                user.getId(), user.getName(), user.getEmail(),
                user.getProfilePicture(), user.getBio(),
                user.getLocation(), user.getWebsite(), user.getCreatedAt(), postCount
        ));
    }

    // ── Get current user's full profile ───────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> getMyProfile(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        long postCount = postRepository.findByAuthorIdOrderByCreatedAtDesc(user.getId(),
                PageRequest.of(0, 1)).getTotalElements();

        return ResponseEntity.ok(new UserProfileDto(
                user.getId(), user.getName(), user.getEmail(),
                user.getProfilePicture(), user.getBio(),
                user.getLocation(), user.getWebsite(), user.getCreatedAt(), postCount
        ));
    }

    // ── Update profile ────────────────────────────────────────────────────────
    @PutMapping("/me")
    public ResponseEntity<UserProfileDto> updateProfile(
            @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        if (request.getName() != null) user.setName(request.getName());
        if (request.getBio() != null) user.setBio(request.getBio());
        if (request.getLocation() != null) user.setLocation(request.getLocation());
        if (request.getWebsite() != null) user.setWebsite(request.getWebsite());

        userRepository.save(user);
        return getMyProfile(userDetails);
    }

    // ── Upload profile picture ────────────────────────────────────────────────
    @PostMapping("/me/profile-picture")
    public ResponseEntity<UserProfileDto> uploadProfilePicture(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        String imageUrl = fileStorageService.storeFile(file);
        user.setProfilePicture(imageUrl);
        userRepository.save(user);

        return getMyProfile(userDetails);
    }

    // ── Get user's posts ──────────────────────────────────────────────────────
    @GetMapping("/{id}/posts")
    public ResponseEntity<?> getUserPosts(@PathVariable Long id,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(
                postRepository.findByAuthorIdAndStatusOrderByCreatedAtDesc(
                        id, com.blogvibe.model.Post.PostStatus.PUBLISHED, pageable)
        );
    }
}
