package com.vaulto.security;

import com.vaulto.model.User;
import com.vaulto.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Optional;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger logger = LoggerFactory.getLogger(OAuth2SuccessHandler.class);

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CookieUtils cookieUtils;

    @Value("${app.oauth2.success-redirect}")
    private String successRedirectUrl;

    @Value("${app.oauth2.failure-redirect}")
    private String failureRedirectUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        try {
            OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
            OAuth2User oauthUser = oauthToken.getPrincipal();

            String email = oauthUser.getAttribute("email");
            String name = oauthUser.getAttribute("name");
            String googleId = oauthUser.getName(); // Usually sub for google
            String avatar = oauthUser.getAttribute("picture");

            if (email == null || email.isBlank()) {
                throw new IllegalStateException("Google account did not return an email address");
            }

            // Handle google id extraction correctly
            if (oauthUser.getAttribute("sub") != null) {
                googleId = oauthUser.getAttribute("sub");
            }

            Optional<User> userOptional = userRepository.findByEmail(email);
            User user;
            if (userOptional.isPresent()) {
                user = userOptional.get();
                if (user.getGoogleId() == null) {
                    user.setGoogleId(googleId);
                    user.setProvider("google");
                    user = userRepository.save(user);
                }
            } else {
                String username = name != null ? name.toLowerCase().replaceAll("\\s+", "_") : email.split("@")[0];
                user = User.builder()
                        .provider("google")
                        .googleId(googleId)
                        .email(email)
                        .name(name)
                        .username(username)
                        .avatar(avatar)
                        .gender("")
                        .dob("")
                        .build();
                user = userRepository.save(user);
            }

            String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail());
            String refreshToken = tokenProvider.generateRefreshToken(user.getId());

            user.setRefreshToken(refreshToken);
            userRepository.save(user);

            cookieUtils.addCookie(response, "accessToken", accessToken, 15 * 60); // 15 mins
            cookieUtils.addCookie(response, "refreshToken", refreshToken, 30 * 24 * 60 * 60); // 30 days

            getRedirectStrategy().sendRedirect(request, response, successRedirectUrl);
        } catch (Exception e) {
            logger.error("Google OAuth success handling failed", e);
            getRedirectStrategy().sendRedirect(request, response, failureRedirectUrl + "?oauth=failed");
        }
    }
}
