package com.blogvibe.security;

import com.blogvibe.model.User;
import com.blogvibe.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        String providerId = oAuth2User.getAttribute("sub"); // Google uses 'sub'

        if (email == null) {
            // Handle error case if email is not provided
            getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/login?error=email_not_found");
            return;
        }

        // Find or create user
        Optional<User> userOptional = userRepository.findByEmail(email);
        User user;
        if (userOptional.isPresent()) {
            user = userOptional.get();
            // Update provider if they previously logged in via local
            if (user.getProvider() == User.AuthProvider.LOCAL) {
                user.setProvider(User.AuthProvider.GOOGLE);
                user.setProviderId(providerId);
                userRepository.save(user);
            }
        } else {
            user = User.builder()
                    .email(email)
                    .name(name != null ? name : email.substring(0, email.indexOf("@")))
                    .profilePicture(picture)
                    .provider(User.AuthProvider.GOOGLE)
                    .providerId(providerId)
                    .build();
            userRepository.save(user);
        }

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(email);

        // Redirect to frontend with token
        String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth2/redirect")
                .queryParam("token", token)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
