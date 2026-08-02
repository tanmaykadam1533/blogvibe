package com.blogvibe.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "blog_moderation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlogModeration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // We can just store blogId if we don't want a hard foreign key (since rejected blogs aren't saved to Post table).
    // Or we store the title/content briefly if we wanted, but the user requested blogId. Wait, if a blog is rejected, it doesn't get saved, so it doesn't have a blogId.
    // If it's an update, it might have an ID. So we can just use Long postId (nullable).
    @Column(name = "post_id")
    private Long postId;

    @Column(nullable = false)
    private Boolean approved;

    private Integer confidence;

    @Column(length = 2000)
    private String reason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
