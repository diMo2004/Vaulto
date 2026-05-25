package com.vaulto.security;

import com.vaulto.model.User;
import com.vaulto.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CookieUtils cookieUtils;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt)) {
                if (tokenProvider.validateToken(jwt, false)) {
                    String userId = tokenProvider.getUserIdFromToken(jwt, false);
                    authenticateUser(userId, request);
                } else {
                    // Try refresh token
                    Optional<Cookie> refreshTokenCookie = cookieUtils.getCookie(request, "refreshToken");
                    if (refreshTokenCookie.isPresent() && StringUtils.hasText(refreshTokenCookie.get().getValue())) {
                        String refreshToken = refreshTokenCookie.get().getValue();
                        if (tokenProvider.validateToken(refreshToken, true)) {
                            String userId = tokenProvider.getUserIdFromToken(refreshToken, true);
                            Optional<User> userOptional = userRepository.findById(userId);

                            if (userOptional.isPresent() && refreshToken.equals(userOptional.get().getRefreshToken())) {
                                // Issue new access token
                                User user = userOptional.get();
                                String newAccessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail());
                                
                                cookieUtils.addCookie(response, "accessToken", newAccessToken, 15 * 60); // 15 mins
                                authenticateUser(userId, request);
                            }
                        }
                    }
                }
            }
        } catch (Exception ex) {
            logger.error("Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    private void authenticateUser(String userId, HttpServletRequest request) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isPresent()) {
            CustomUserDetails userDetails = CustomUserDetails.create(userOptional.get());
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        // Try cookie first
        Optional<Cookie> cookie = cookieUtils.getCookie(request, "accessToken");
        if (cookie.isPresent()) {
            return cookie.get().getValue();
        }

        // Try header fallback
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
