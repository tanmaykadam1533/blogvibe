package com.blogvibe.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    private final HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;

    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
        log.error("OAuth2 authentication failed", exception);
        
        httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);

        String primaryFrontendUrl = getPrimaryFrontendUrl();
        String errorMsg = URLEncoder.encode(exception.getLocalizedMessage() != null ? exception.getLocalizedMessage() : "Authentication failed", StandardCharsets.UTF_8);

        String targetUrl = UriComponentsBuilder.fromUriString(primaryFrontendUrl + "/login")
                .queryParam("error", errorMsg)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
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
