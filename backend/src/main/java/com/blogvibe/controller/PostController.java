package com.blogvibe.controller;

import com.blogvibe.dto.*;
import com.blogvibe.model.*;
import com.blogvibe.repository.*;
import com.blogvibe.service.FileStorageService;
import com.blogvibe.service.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final LikeRepository likeRepository;
    private final PostImageRepository postImageRepository;
    private final FileStorageService fileStorageService;
    private final AIService aiService;
    private final BlogModerationRepository blogModerationRepository;

    // ── Get all published posts (paginated) ──────────────────────────────────
    @GetMapping
    public ResponseEntity<Page<PostSummaryDto>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal UserDetails userDetails) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Long currentUserId = userDetails != null
                ? userRepository.findByEmail(userDetails.getUsername()).map(User::getId).orElse(null)
                : null;

        Page<Post> posts;
        if (search != null && !search.isBlank()) {
            posts = postRepository.searchPosts(search, pageable);
        } else if (category != null && !category.isBlank()) {
            posts = postRepository.findByCategoryAndStatusOrderByCreatedAtDesc(category, Post.PostStatus.PUBLISHED, pageable);
        } else {
            posts = postRepository.findByStatusOrderByCreatedAtDesc(Post.PostStatus.PUBLISHED, pageable);
        }

        return ResponseEntity.ok(posts.map(p -> toSummaryDto(p, currentUserId)));
    }

    // ── Get single post ───────────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<PostDetailDto> getPost(@PathVariable Long id,
                                                  @AuthenticationPrincipal UserDetails userDetails) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        // Increment view count
        post.setViewCount(post.getViewCount() + 1);
        postRepository.save(post);

        Long currentUserId = userDetails != null
                ? userRepository.findByEmail(userDetails.getUsername()).map(User::getId).orElse(null)
                : null;

        return ResponseEntity.ok(toDetailDto(post, currentUserId));
    }

    // ── Create post ───────────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> createPost(
            @Valid @RequestBody CreatePostRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        Post post = Post.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .summary(request.getSummary())
                .category(request.getCategory())
                .tags(request.getTags() != null ? request.getTags() : new ArrayList<>())
                .coverImage(request.getCoverImage())
                .status(request.isDraft() ? Post.PostStatus.DRAFT : Post.PostStatus.PUBLISHED)
                .author(user)
                .build();

        if (!request.isDraft()) {
            ModerationResponse modRes = aiService.moderateBlog(post.getTitle(), post.getContent());
            if (!modRes.getApproved()) {
                blogModerationRepository.save(BlogModeration.builder()
                        .approved(false)
                        .confidence(modRes.getConfidence())
                        .reason(modRes.getReason())
                        .build());
                return ResponseEntity.badRequest().body(modRes);
            }
            blogModerationRepository.save(BlogModeration.builder()
                    .approved(true)
                    .confidence(modRes.getConfidence())
                    .reason(modRes.getReason())
                    .build());
        }

        postRepository.save(post);
        return ResponseEntity.ok(toDetailDto(post, user.getId()));
    }

    // ── Update post ───────────────────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody CreatePostRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Post post = postRepository.findById(id).orElseThrow();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        if (!post.getAuthor().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setSummary(request.getSummary());
        post.setCategory(request.getCategory());
        post.setTags(request.getTags() != null ? request.getTags() : new ArrayList<>());
        post.setCoverImage(request.getCoverImage());
        post.setStatus(request.isDraft() ? Post.PostStatus.DRAFT : Post.PostStatus.PUBLISHED);
        post.setUpdatedAt(LocalDateTime.now());

        if (!request.isDraft()) {
            ModerationResponse modRes = aiService.moderateBlog(post.getTitle(), post.getContent());
            if (!modRes.getApproved()) {
                blogModerationRepository.save(BlogModeration.builder()
                        .postId(post.getId())
                        .approved(false)
                        .confidence(modRes.getConfidence())
                        .reason(modRes.getReason())
                        .build());
                return ResponseEntity.badRequest().body(modRes);
            }
            blogModerationRepository.save(BlogModeration.builder()
                    .postId(post.getId())
                    .approved(true)
                    .confidence(modRes.getConfidence())
                    .reason(modRes.getReason())
                    .build());
        }

        postRepository.save(post);
        return ResponseEntity.ok(toDetailDto(post, user.getId()));
    }

    // ── Delete post ───────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id,
                                         @AuthenticationPrincipal UserDetails userDetails) {
        Post post = postRepository.findById(id).orElseThrow();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        if (!post.getAuthor().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        postRepository.delete(post);
        return ResponseEntity.ok(new MessageResponse("Post deleted successfully"));
    }

    // ── Upload image for a post ───────────────────────────────────────────────
    @PostMapping("/{id}/images")
    public ResponseEntity<Map<String, String>> uploadImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {

        Post post = postRepository.findById(id).orElseThrow();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        if (!post.getAuthor().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        String imageUrl = fileStorageService.storeFile(file);

        PostImage postImage = PostImage.builder()
                .imageUrl(imageUrl)
                .post(post)
                .build();
        postImageRepository.save(postImage);

        return ResponseEntity.ok(Map.of("url", imageUrl));
    }

    // ── Upload cover image (no post needed yet) ───────────────────────────────
    @PostMapping("/upload-image")
    public ResponseEntity<Map<String, String>> uploadStandaloneImage(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        String imageUrl = fileStorageService.storeFile(file);
        return ResponseEntity.ok(Map.of("url", imageUrl));
    }

    // ── Like / Unlike ─────────────────────────────────────────────────────────
    @PostMapping("/{id}/like")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Post post = postRepository.findById(id).orElseThrow();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        Optional<Like> existing = likeRepository.findByPostIdAndUserId(id, user.getId());
        boolean liked;

        if (existing.isPresent()) {
            likeRepository.delete(existing.get());
            post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
            liked = false;
        } else {
            Like like = Like.builder().post(post).user(user).build();
            likeRepository.save(like);
            post.setLikeCount(post.getLikeCount() + 1);
            liked = true;
        }

        postRepository.save(post);
        return ResponseEntity.ok(Map.of("liked", liked, "likeCount", post.getLikeCount()));
    }

    // ── Comments on a post ────────────────────────────────────────────────────
    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentDto>> getComments(@PathVariable Long id) {
        List<Comment> rootComments = commentRepository.findByPostIdAndParentIsNullOrderByCreatedAtDesc(id);
        return ResponseEntity.ok(rootComments.stream().map(this::toCommentDto).collect(Collectors.toList()));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentDto> addComment(
            @PathVariable Long id,
            @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        Post post = postRepository.findById(id).orElseThrow();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        Comment comment = Comment.builder()
                .content(request.getContent())
                .post(post)
                .user(user)
                .build();

        if (request.getParentId() != null) {
            commentRepository.findById(request.getParentId()).ifPresent(comment::setParent);
        }

        commentRepository.save(comment);
        return ResponseEntity.ok(toCommentDto(comment));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId,
                                            @AuthenticationPrincipal UserDetails userDetails) {
        Comment comment = commentRepository.findById(commentId).orElseThrow();
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        if (!comment.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        commentRepository.delete(comment);
        return ResponseEntity.ok(new MessageResponse("Comment deleted"));
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────
    private PostSummaryDto toSummaryDto(Post post, Long currentUserId) {
        boolean liked = currentUserId != null && likeRepository.existsByPostIdAndUserId(post.getId(), currentUserId);
        return new PostSummaryDto(
                post.getId(), post.getTitle(), post.getSummary(), post.getCoverImage(),
                post.getCategory(), post.getTags(), post.getViewCount(), post.getLikeCount(),
                commentRepository.countByPostId(post.getId()),
                post.getCreatedAt(), post.getUpdatedAt(),
                new AuthorDto(post.getAuthor().getId(), post.getAuthor().getName(),
                        post.getAuthor().getProfilePicture()),
                liked, post.getStatus().name()
        );
    }

    private PostDetailDto toDetailDto(Post post, Long currentUserId) {
        boolean liked = currentUserId != null && likeRepository.existsByPostIdAndUserId(post.getId(), currentUserId);
        List<String> imageUrls = post.getImages().stream().map(PostImage::getImageUrl).collect(Collectors.toList());
        return new PostDetailDto(
                post.getId(), post.getTitle(), post.getContent(), post.getSummary(),
                post.getCoverImage(), post.getCategory(), post.getTags(), post.getViewCount(),
                post.getLikeCount(), commentRepository.countByPostId(post.getId()),
                post.getCreatedAt(), post.getUpdatedAt(),
                new AuthorDto(post.getAuthor().getId(), post.getAuthor().getName(),
                        post.getAuthor().getProfilePicture()),
                liked, post.getStatus().name(), imageUrls
        );
    }

    private CommentDto toCommentDto(Comment comment) {
        List<CommentDto> replies = commentRepository.findByParentIdOrderByCreatedAt(comment.getId())
                .stream().map(this::toCommentDto).collect(Collectors.toList());
        return new CommentDto(
                comment.getId(), comment.getContent(), comment.getCreatedAt(),
                new AuthorDto(comment.getUser().getId(), comment.getUser().getName(),
                        comment.getUser().getProfilePicture()),
                replies
        );
    }
}
