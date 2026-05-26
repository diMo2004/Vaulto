package com.vaulto.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Base64;
import java.util.Optional;

@Component
public class CookieUtils {

    @Value("${app.cookie.domain:localhost}")
    private String cookieDomain;

    public Optional<Cookie> getCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(name)) {
                    return Optional.of(cookie);
                }
            }
        }
        return Optional.empty();
    }

    public void addCookie(HttpServletResponse response, String name, String value, int maxAge) {
        Cookie cookie = new Cookie(name, value);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(maxAge);
        cookie.setDomain(cookieDomain);
        
        // SameSite=Lax can be configured via Response cookie header, 
        // but adding standard properties is enough for Spring generally, 
        // for full production add sameSite and secure flags.
        // cookie.setSecure(true); // requires HTTPS
        response.addCookie(cookie);
    }

    public void deleteCookie(HttpServletRequest request, HttpServletResponse response, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(name)) {
                    cookie.setValue("");
                    cookie.setPath("/");
                    cookie.setMaxAge(0);
                    cookie.setDomain(cookieDomain);
                    response.addCookie(cookie);
                }
            }
        }
    }

    public String serialize(Object object) {
        try (java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
             java.io.ObjectOutputStream oos = new java.io.ObjectOutputStream(baos)) {
            oos.writeObject(object);
            return Base64.getUrlEncoder().encodeToString(baos.toByteArray());
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to serialize object", e);
        }
    }

    public <T> T deserialize(Cookie cookie, Class<T> cls) {
        byte[] decodedBytes = Base64.getUrlDecoder().decode(cookie.getValue());
        try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(decodedBytes);
             java.io.ObjectInputStream ois = new java.io.ObjectInputStream(bais)) {
            return cls.cast(ois.readObject());
        } catch (java.io.IOException | ClassNotFoundException e) {
            throw new RuntimeException("Failed to deserialize object", e);
        }
    }
}
