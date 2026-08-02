package com.blogvibe.repository;

import com.blogvibe.model.BlogModeration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BlogModerationRepository extends JpaRepository<BlogModeration, Long> {
    long countByApproved(Boolean approved);
}
