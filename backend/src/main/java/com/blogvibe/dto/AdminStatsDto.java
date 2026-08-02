package com.blogvibe.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsDto {
    private long totalUsers;
    private long totalPosts;
    private long totalPublishedPosts;
    private long totalDraftPosts;
    private long totalComments;
    private long totalModerations;
    private long approvedModerations;
    private long rejectedModerations;
}
