package com.vaulto.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Objects;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TwilioSmsService {

    private static final Logger logger = LoggerFactory.getLogger(TwilioSmsService.class);

    @Value("${app.twilio.account-sid}")
    private String accountSid;

    @Value("${app.twilio.auth-token}")
    private String authToken;

    @Value("${app.twilio.from-number}")
    private String fromNumber;

    private final Random random = new Random();

    // Simple in-memory OTP store (In production, use Redis)
    private final Map<String, String> otpStore = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        if (accountSid != null && !accountSid.isEmpty() && !"your_twilio_account_sid".equals(accountSid)) {
            Twilio.init(accountSid, authToken);
            logger.info("Twilio initialized");
        } else {
            logger.warn("Twilio credentials not configured properly");
        }
    }

    public void sendOtp(String toPhoneNumber) {
        String normalizedPhoneNumber = normalizePhoneNumber(toPhoneNumber);
        String otp = generateOtp();
        otpStore.put(normalizedPhoneNumber, otp);
        
        String messageBody = "Your Vaulto login code is: " + otp;
        
        try {
            if (accountSid != null && !accountSid.isEmpty() && !"your_twilio_account_sid".equals(accountSid)) {
                Message message = Message.creator(
                        new PhoneNumber(normalizedPhoneNumber),
                        new PhoneNumber(fromNumber),
                        messageBody)
                    .create();
                logger.info("Sent OTP to {}: SID {}", normalizedPhoneNumber, message.getSid());
            } else {
                logger.info("MOCK OTP sent to {}: {}", normalizedPhoneNumber, otp);
            }
        } catch (Exception e) {
            logger.error("Failed to send OTP to {}: {}", normalizedPhoneNumber, e.getMessage());
            throw new RuntimeException("Failed to send OTP. Please check the phone number and try again.");
        }
    }

    public boolean verifyOtp(String toPhoneNumber, String otp) {
        String normalizedPhoneNumber = normalizePhoneNumber(toPhoneNumber);
        String storedOtp = otpStore.get(normalizedPhoneNumber);
        if (storedOtp != null && storedOtp.equals(Objects.toString(otp, "").trim())) {
            otpStore.remove(normalizedPhoneNumber);
            return true;
        }
        return false;
    }

    private String generateOtp() {
        return String.format("%06d", random.nextInt(1_000_000));
    }

    private String normalizePhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            throw new RuntimeException("Phone number is required");
        }
        String normalized = phoneNumber.trim().replaceAll("[\\s()-]", "");
        if (!normalized.startsWith("+")) {
            throw new RuntimeException("Phone number must include country code, for example +919876543210");
        }
        return normalized;
    }
}
