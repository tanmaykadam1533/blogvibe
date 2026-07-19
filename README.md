# BlogVibe 🖊️

A full-stack blogging / vlogging platform built with **Spring Boot**, **React**, and **MySQL**.

## ✨ Features

| Feature | Details |
|---|---|
| **Authentication** | Email/password login & registration (JWT) |
| **Rich Editor** | Quill.js with formatting, image embeds |
| **Image Uploads** | Cover images & inline post images (local disk / easily swapped for S3) |
| **Likes** | Toggle like on any post |
| **Comments** | Nested threaded comments (reply to replies) |
| **Internal Sharing** | Share any post with another registered user, with an optional message |
| **Inbox** | Notification inbox with unread badge in navbar |
| **Profiles** | Avatar upload, bio, location, website |
| **Categories & Tags** | Filter feed by category; tag posts |
| **Search** | Full-text search across title, content, category |
| **Draft / Publish** | Save as draft or publish immediately |

---

## 🗂️ Project Structure

```
blogvibe/
├── backend/          # Spring Boot 3 (Java 17)
│   ├── src/
│   │   └── main/java/com/blogvibe/
│   │       ├── config/       # Security, CORS, exception handler
│   │       ├── controller/   # REST endpoints
│   │       ├── dto/          # Request / response objects
│   │       ├── model/        # JPA entities
│   │       ├── repository/   # Spring Data repos
│   │       ├── security/     # JWT + OAuth2 handlers
│   │       └── service/      # Business logic, file storage
│   ├── Dockerfile
│   └── pom.xml
├── frontend/         # React 18
│   ├── src/
│   │   ├── api/      # Axios client + endpoint helpers
│   │   ├── components/  # Navbar, PostCard, ShareModal
│   │   ├── context/  # AuthContext (global user state)
│   │   └── pages/    # Home, Login, Register, PostDetail, CreatePost, …
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── database/
│   └── schema.sql    # DDL (Spring auto-creates tables too)
└── docker-compose.yml
```

---

## 🚀 Quick Start — Docker (Recommended)

### 1. Prerequisites
- Docker + Docker Compose installed

### 2. Clone & Configure

```bash
git clone <your-repo-url> blogvibe
cd blogvibe

# Run docker-compose
docker-compose up --build
```

### 3. Run

```bash
docker-compose up --build
```

Open **http://localhost:3000** 🎉

---

## 🔧 Manual Setup (Dev Mode)

### Backend

```bash
cd backend

# 1. Create the MySQL database
mysql -u root -p < ../database/schema.sql

# 2. Edit src/main/resources/application.properties
#    Set your DB password and Google OAuth credentials

# 3. Run
mvn spring-boot:run
# API available at http://localhost:8080
```

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm start
# App available at http://localhost:3000
```

---



---

## 📡 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Register with email/password |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Current user info |

### Posts
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/posts` | ❌ | List posts (`?page=0&size=10&category=Tech&search=react`) |
| GET | `/api/posts/{id}` | ❌ | Single post (increments view count) |
| POST | `/api/posts` | ✅ | Create post |
| PUT | `/api/posts/{id}` | ✅ | Update post (author only) |
| DELETE | `/api/posts/{id}` | ✅ | Delete post (author only) |
| POST | `/api/posts/{id}/like` | ✅ | Toggle like |
| POST | `/api/posts/upload-image` | ✅ | Upload image, returns URL |

### Comments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/posts/{id}/comments` | ❌ | Get comments (threaded) |
| POST | `/api/posts/{id}/comments` | ✅ | Add comment / reply |
| DELETE | `/api/posts/comments/{id}` | ✅ | Delete own comment |

### Shares
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/shares` | ✅ | Share a post with a user |
| GET | `/api/shares/inbox` | ✅ | Get received shares |
| GET | `/api/shares/unread-count` | ✅ | Unread count |
| PATCH | `/api/shares/{id}/read` | ✅ | Mark as read |
| GET | `/api/shares/search-users?q=` | ✅ | Search users to share with |

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users/{id}/profile` | ❌ | Public profile |
| GET | `/api/users/me` | ✅ | My profile |
| PUT | `/api/users/me` | ✅ | Update profile |
| POST | `/api/users/me/profile-picture` | ✅ | Upload avatar |
| GET | `/api/users/{id}/posts` | ❌ | User's published posts |

---

## 🗄️ Database Schema (simplified)

```
users         ──< posts ──< comments (self-referencing for replies)
                        ──< likes
                        ──< post_images
                        ──< shares (sender → recipient)
                        ──< post_tags
```

---

## 🛡️ Security Notes

- JWTs are signed with HS512; change `app.jwt.secret` in production
- Passwords are hashed with BCrypt
- Google OAuth users have no password stored
- File uploads are validated by content type; limit is 10 MB
- CORS is restricted to `http://localhost:3000` — update for production

---

## 🔄 Swapping Local Storage for S3

Replace `FileStorageService.storeFile()`:

```java
// Add AWS SDK dependency to pom.xml, then:
S3Client s3 = S3Client.builder().region(Region.US_EAST_1).build();
PutObjectRequest req = PutObjectRequest.builder()
    .bucket("your-bucket").key(filename).contentType(file.getContentType()).build();
s3.putObject(req, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
return "https://your-bucket.s3.amazonaws.com/" + filename;
```

---

## 🧰 Tech Stack

**Backend:** Spring Boot 3.2, Spring Security, Spring Data JPA, JWT (JJWT), Lombok  
**Frontend:** React 18, React Router 6, Axios, React Quill, Lucide Icons, react-hot-toast, date-fns  
**Database:** MySQL 8  
**DevOps:** Docker, Docker Compose, Nginx
