-- ============================================================
--  BlogVibe – MySQL Schema
--  Run this once to create the database and user.
--  Spring Boot (ddl-auto=update) will create/update tables.
-- ============================================================

CREATE DATABASE IF NOT EXISTS blogvibe_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'blogvibe'@'localhost' IDENTIFIED BY 'blogvibe_pass';
GRANT ALL PRIVILEGES ON blogvibe_db.* TO 'blogvibe'@'localhost';
FLUSH PRIVILEGES;

USE blogvibe_db;

-- ── Users ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  email            VARCHAR(255) NOT NULL UNIQUE,
  name             VARCHAR(255) NOT NULL,
  password         VARCHAR(255),
  profile_picture  TEXT,
  bio              VARCHAR(500),
  location         VARCHAR(255),
  website          VARCHAR(255),
  provider         ENUM('LOCAL','GOOGLE') DEFAULT 'LOCAL',
  provider_id      VARCHAR(255),
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Posts ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(500) NOT NULL,
  content      LONGTEXT NOT NULL,
  summary      VARCHAR(1000),
  cover_image  TEXT,
  status       ENUM('DRAFT','PUBLISHED') DEFAULT 'PUBLISHED',
  category     VARCHAR(100),
  view_count   BIGINT DEFAULT 0,
  like_count   BIGINT DEFAULT 0,
  author_id    BIGINT NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_posts_author   (author_id),
  INDEX idx_posts_status   (status),
  INDEX idx_posts_category (category),
  INDEX idx_posts_created  (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Post tags (element collection) ─────────────────────────
CREATE TABLE IF NOT EXISTS post_tags (
  post_id BIGINT NOT NULL,
  tag     VARCHAR(100),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Post images ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_images (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  image_url   TEXT NOT NULL,
  alt_text    VARCHAR(255),
  post_id     BIGINT NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Comments ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  content    TEXT NOT NULL,
  post_id    BIGINT NOT NULL,
  user_id    BIGINT NOT NULL,
  parent_id  BIGINT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  FOREIGN KEY (post_id)   REFERENCES posts(id)    ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
  INDEX idx_comments_post   (post_id),
  INDEX idx_comments_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Likes ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id    BIGINT NOT NULL,
  user_id    BIGINT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_likes (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Shares (internal) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS shares (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id      BIGINT NOT NULL,
  sender_id    BIGINT NOT NULL,
  recipient_id BIGINT NOT NULL,
  message      VARCHAR(500),
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id)      REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_shares_recipient (recipient_id),
  INDEX idx_shares_unread    (recipient_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
