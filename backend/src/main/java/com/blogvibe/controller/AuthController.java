package com.blogvibe.controller;

import com.blogvibe.dto.*;
import com.blogvibe.model.Role;
import com.blogvibe.model.User;
import com.blogvibe.repository.UserRepository;
import com.blogvibe.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Email already in use"));
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .provider(User.AuthProvider.LOCAL)
                .role(Role.ROLE_USER)
                .build();

        userRepository.save(user);
        String token = tokenProvider.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, toUserDto(user)));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
            String token = tokenProvider.generateToken(user.getEmail());
            return ResponseEntity.ok(new AuthResponse(token, toUserDto(user)));
        } catch (BadCredentialsException e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid email or password"));
        }
    }

    @PostMapping("/admin/login")
    public ResponseEntity<?> adminLogin(@Valid @RequestBody AdminLoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            User user = userRepository.findByEmail(request.getEmail()).orElseThrow();

            if (user.getProvider() != User.AuthProvider.LOCAL) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Google sign-in is not permitted for Admin access. Please log in with local admin credentials."));
            }

            if (user.getRole() != Role.ROLE_ADMIN) {
                return ResponseEntity.status(403)
                        .body(new MessageResponse("Access denied: Account does not have Administrator privileges."));
            }

            if (user.getBanned() != null && user.getBanned()) {
                return ResponseEntity.status(403)
                        .body(new MessageResponse("Account is currently disabled or banned."));
            }

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String token = tokenProvider.generateToken(user.getEmail());
            return ResponseEntity.ok(new AuthResponse(token, toUserDto(user)));
        } catch (BadCredentialsException e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid admin username or password"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            return ResponseEntity.status(401).body(new MessageResponse("Unauthorized"));
        }
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(new MessageResponse("User not found"));
        }
        return ResponseEntity.ok(toUserDto(user));
    }

    private UserDto toUserDto(User user) {
        return new UserDto(user.getId(), user.getName(), user.getEmail(),
                user.getProfilePicture(), user.getBio(), user.getLocation(),
                user.getWebsite(), user.getRole(), user.getBanned(), user.getCreatedAt());
    }
}
