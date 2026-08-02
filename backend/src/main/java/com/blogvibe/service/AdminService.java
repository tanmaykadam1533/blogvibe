package com.blogvibe.service;

import com.blogvibe.dto.AdminStatsDto;
import com.blogvibe.dto.AuthorDto;
import com.blogvibe.dto.PostSummaryDto;
import com.blogvibe.dto.UserDto;
import com.blogvibe.model.BlogModeration;
import com.blogvibe.model.Post;
import com.blogvibe.model.Role;
import com.blogvibe.model.User;
import com.blogvibe.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final BlogModerationRepository blogModerationRepository;

    public AdminStatsDto getAdminStats() {
        long totalUsers = userRepository.count();
        long totalPosts = postRepository.count();
        long totalPublishedPosts = postRepository.countByStatus(Post.PostStatus.PUBLISHED);
        long totalDraftPosts = postRepository.countByStatus(Post.PostStatus.DRAFT);
        long totalComments = commentRepository.count();
        long totalModerations = blogModerationRepository.count();
        long approvedModerations = blogModerationRepository.countByApproved(true);
        long rejectedModerations = blogModerationRepository.countByApproved(false);

        return AdminStatsDto.builder()
                .totalUsers(totalUsers)
                .totalPosts(totalPosts)
                .totalPublishedPosts(totalPublishedPosts)
                .totalDraftPosts(totalDraftPosts)
                .totalComments(totalComments)
                .totalModerations(totalModerations)
                .approvedModerations(approvedModerations)
                .rejectedModerations(rejectedModerations)
                .build();
    }

    public List<UserDto> getAllUsers(String query) {
        List<User> users;
        if (query != null && !query.trim().isEmpty()) {
            users = userRepository.searchUsers(query.trim());
        } else {
            users = userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        }
        return users.stream().map(this::toUserDto).collect(Collectors.toList());
    }

    @Transactional
    public UserDto updateUserRole(Long userId, Role newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        user.setRole(newRole);
        user = userRepository.save(user);
        return toUserDto(user);
    }

    @Transactional
    public UserDto updateUserStatus(Long userId, Boolean banned) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        user.setBanned(banned);
        user = userRepository.save(user);
        return toUserDto(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found with ID: " + userId);
        }
        userRepository.deleteById(userId);
    }

    public List<PostSummaryDto> getAllPosts() {
        List<Post> posts = postRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        return posts.stream().map(this::toPostSummaryDto).collect(Collectors.toList());
    }

    @Transactional
    public void deletePost(Long postId) {
        if (!postRepository.existsById(postId)) {
            throw new RuntimeException("Post not found with ID: " + postId);
        }
        postRepository.deleteById(postId);
    }

    public List<BlogModeration> getModerationLogs() {
        return blogModerationRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    private UserDto toUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .profilePicture(user.getProfilePicture())
                .bio(user.getBio())
                .location(user.getLocation())
                .website(user.getWebsite())
                .role(user.getRole())
                .banned(user.getBanned())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private PostSummaryDto toPostSummaryDto(Post post) {
        AuthorDto authorDto = new AuthorDto(
                post.getAuthor().getId(),
                post.getAuthor().getName(),
                post.getAuthor().getProfilePicture()
        );

        long commentCount = commentRepository.countByPostId(post.getId());

        return new PostSummaryDto(
                post.getId(),
                post.getTitle(),
                post.getSummary(),
                post.getCoverImage(),
                post.getCategory(),
                post.getTags(),
                post.getViewCount(),
                post.getLikeCount(),
                commentCount,
                post.getCreatedAt(),
                post.getUpdatedAt(),
                authorDto,
                false,
                post.getStatus() != null ? post.getStatus().name() : "PUBLISHED"
        );
    }
}
