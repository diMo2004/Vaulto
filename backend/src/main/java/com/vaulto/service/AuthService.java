package com.vaulto.service;

import com.vaulto.dto.*;
import com.vaulto.model.User;
import com.vaulto.repository.UserRepository;
import com.vaulto.security.CookieUtils;
import com.vaulto.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private CookieUtils cookieUtils;

    @Autowired
    private TwilioSmsService twilioSmsService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email is already in use");
        }

        User user = User.builder()
                .provider("local")
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .username(request.getUsername())
                .dob(request.getDob())
                .gender(request.getGender())
                .build();

        user = userRepository.save(user);

        return new AuthResponse("Registration successful", null, user.getId());
    }

    public AuthResponse login(LoginRequest request, HttpServletResponse response) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        issueTokens(user, response);

        return new AuthResponse("Login successful", UserResponse.fromUser(user), user.getId());
    }

    public void startPhoneLogin(String phone) {
        // Send OTP
        twilioSmsService.sendOtp(phone);
    }

    public AuthResponse verifyPhoneLogin(String phone, String otp, HttpServletResponse response) {
        boolean isValid = twilioSmsService.verifyOtp(phone, otp);
        if (!isValid) {
            throw new RuntimeException("Invalid OTP");
        }

        Optional<User> userOpt = userRepository.findByPhone(phone);
        User user;
        if (userOpt.isPresent()) {
            user = userOpt.get();
        } else {
            // Register new user with phone
            user = User.builder()
                    .provider("phone")
                    .phone(phone)
                    .build();
            user = userRepository.save(user);
        }

        issueTokens(user, response);
        return new AuthResponse("Phone login successful", UserResponse.fromUser(user), user.getId());
    }

    public void logout(HttpServletRequest request, HttpServletResponse response) {
        cookieUtils.deleteCookie(request, response, "accessToken");
        cookieUtils.deleteCookie(request, response, "refreshToken");
    }

    public UserResponse updateProfile(String userId, ProfileUpdateRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        
        if (request.getName() != null) user.setName(request.getName());
        if (request.getUsername() != null) user.setUsername(request.getUsername());
        if (request.getDob() != null) user.setDob(request.getDob());
        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getAvatar() != null) user.setAvatar(request.getAvatar());
        
        return UserResponse.fromUser(userRepository.save(user));
    }
    
    public UserResponse getProfile(String userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        return UserResponse.fromUser(user);
    }

    private void issueTokens(User user, HttpServletResponse response) {
        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId());

        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        cookieUtils.addCookie(response, "accessToken", accessToken, 15 * 60);
        cookieUtils.addCookie(response, "refreshToken", refreshToken, 30 * 24 * 60 * 60);
    }
}
