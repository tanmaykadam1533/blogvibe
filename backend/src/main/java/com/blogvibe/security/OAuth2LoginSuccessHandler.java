package com.blogvibe.security;

import com.blogvibe.model.Role;
import com.blogvibe.model.User;
import com.blogvibe.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;

    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        String primaryFrontendUrl = getPrimaryFrontendUrl();

        try {
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
            String email = oAuth2User.getAttribute("email");
            String name = oAuth2User.getAttribute("name");
            String picture = oAuth2User.getAttribute("picture");
            String providerId = oAuth2User.getAttribute("sub");

            if (email == null) {
                httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);
                getRedirectStrategy().sendRedirect(request, response, primaryFrontendUrl + "/login?error=email_not_found");
                return;
            }

            Optional<User> userOptional = userRepository.findByEmail(email);
            User user;
            if (userOptional.isPresent()) {
                user = userOptional.get();
                if (user.getProvider() == null || user.getProvider() == User.AuthProvider.LOCAL) {
                    user.setProvider(User.AuthProvider.GOOGLE);
                    user.setProviderId(providerId);
                }
                if (user.getRole() == null) user.setRole(Role.ROLE_USER);
                if (user.getBanned() == null) user.setBanned(false);
                if (user.getCreatedAt() == null) user.setCreatedAt(LocalDateTime.now());
                userRepository.save(user);
            } else {
                user = User.builder()
                        .email(email)
                        .name(name != null ? name : email.substring(0, email.indexOf("@")))
                        .profilePicture(picture)
                        .provider(User.AuthProvider.GOOGLE)
                        .providerId(providerId)
                        .role(Role.ROLE_USER)
                        .banned(false)
                        .createdAt(LocalDateTime.now())
                        .build();
                userRepository.save(user);
            }

            String token = jwtTokenProvider.generateToken(email);
            httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);

            String targetUrl = UriComponentsBuilder.fromUriString(primaryFrontendUrl + "/oauth2/redirect")
                    .queryParam("token", token)
                    .build().toUriString();

            getRedirectStrategy().sendRedirect(request, response, targetUrl);
        } catch (Exception e) {
            log.error("Error during OAuth2 authentication success processing", e);
            httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);
            String errorMsg = URLEncoder.encode(e.getMessage() != null ? e.getMessage() : "OAuth authentication failed", StandardCharsets.UTF_8);
            getRedirectStrategy().sendRedirect(request, response, primaryFrontendUrl + "/login?error=" + errorMsg);
        }
    }

    private String getPrimaryFrontendUrl() {
        if (allowedOrigins == null || allowedOrigins.isBlank()) {
            return "http://localhost:3000";
        }
        String firstOrigin = allowedOrigins.split(",")[0].trim();
        if (firstOrigin.endsWith("/")) {
            firstOrigin = firstOrigin.substring(0, firstOrigin.length() - 1);
        }
        return firstOrigin;
    }
}
