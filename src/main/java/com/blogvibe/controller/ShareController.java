package com.blogvibe.controller;

import com.blogvibe.dto.*;
import com.blogvibe.model.*;
import com.blogvibe.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/shares")
@RequiredArgsConstructor
public class ShareController {

    private final ShareRepository shareRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    // ── Share a post with another user ───────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> sharePost(@RequestBody ShareRequest request,
                                        @AuthenticationPrincipal UserDetails userDetails) {
        User sender = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        User recipient = userRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new RuntimeException("Recipient not found"));
        Post post = postRepository.findById(request.getPostId())
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (sender.getId().equals(recipient.getId())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Cannot share with yourself"));
        }

        Share share = Share.builder()
                .post(post)
                .sender(sender)
                .recipient(recipient)
                .message(request.getMessage())
                .build();

        shareRepository.save(share);
        return ResponseEntity.ok(new MessageResponse("Post shared successfully"));
    }

    // ── Get shares received (inbox) ───────────────────────────────────────────
    @GetMapping("/inbox")
    public ResponseEntity<Page<ShareDto>> getInbox(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Pageable pageable = PageRequest.of(page, size);
        Page<Share> shares = shareRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId(), pageable);

        return ResponseEntity.ok(shares.map(this::toShareDto));
    }

    // ── Count unread shares ───────────────────────────────────────────────────
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        long count = shareRepository.countByRecipientIdAndIsReadFalse(user.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    // ── Mark share as read ────────────────────────────────────────────────────
    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id,
                                         @AuthenticationPrincipal UserDetails userDetails) {
        Share share = shareRepository.findById(id).orElseThrow();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        if (!share.getRecipient().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        share.setRead(true);
        shareRepository.save(share);
        return ResponseEntity.ok(new MessageResponse("Marked as read"));
    }

    // ── Search users to share with ────────────────────────────────────────────
    @GetMapping("/search-users")
    public ResponseEntity<List<UserSummaryDto>> searchUsers(
            @RequestParam String q,
            @AuthenticationPrincipal UserDetails userDetails) {
        User me = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        List<UserSummaryDto> users = userRepository.searchUsers(q).stream()
                .filter(u -> !u.getId().equals(me.getId()))
                .map(u -> new UserSummaryDto(u.getId(), u.getName(), u.getEmail(), u.getProfilePicture()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    private ShareDto toShareDto(Share share) {
        return new ShareDto(
                share.getId(),
                share.getMessage(),
                share.isRead(),
                share.getCreatedAt(),
                new UserSummaryDto(share.getSender().getId(), share.getSender().getName(),
                        share.getSender().getEmail(), share.getSender().getProfilePicture()),
                new PostSharePreviewDto(share.getPost().getId(), share.getPost().getTitle(),
                        share.getPost().getSummary(), share.getPost().getCoverImage())
        );
    }
}
