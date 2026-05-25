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
        String otp = generateOtp();
        otpStore.put(toPhoneNumber, otp);
        
        String messageBody = "Your Vaulto login code is: " + otp;
        
        try {
            if (accountSid != null && !accountSid.isEmpty() && !"your_twilio_account_sid".equals(accountSid)) {
                Message message = Message.creator(
                        new PhoneNumber(toPhoneNumber),
                        new PhoneNumber(fromNumber),
                        messageBody)
                    .create();
                logger.info("Sent OTP to {}: SID {}", toPhoneNumber, message.getSid());
            } else {
                logger.info("MOCK OTP sent to {}: {}", toPhoneNumber, otp);
            }
        } catch (Exception e) {
            logger.error("Failed to send OTP to {}: {}", toPhoneNumber, e.getMessage());
            // Fallback for development if Twilio fails
            logger.info("MOCK OTP sent to {}: {}", toPhoneNumber, otp);
        }
    }

    public boolean verifyOtp(String toPhoneNumber, String otp) {
        String storedOtp = otpStore.get(toPhoneNumber);
        if (storedOtp != null && storedOtp.equals(otp)) {
            otpStore.remove(toPhoneNumber);
            return true;
        }
        return false;
    }

    private String generateOtp() {
        int otp = (int) (Math.random() * 9000) + 1000; // 4 digit OTP
        return String.valueOf(otp);
    }
}
