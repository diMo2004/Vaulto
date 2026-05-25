package com.vaulto.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MetadataExtractor {

    private static final String[] KNOWN_STORES = {
        "Amazon", "Flipkart", "Myntra", "Ajio", "Swiggy", "Zomato",
        "Uber", "Ola", "MakeMyTrip", "Goibibo", "Nykaa", "BigBasket",
        "Blinkit", "Zepto", "Dominos", "PizzaHut", "KFC", "McDonalds"
    };

    public static String extractStore(String text) {
        if (text == null) return "Unknown";
        for (String store : KNOWN_STORES) {
            if (Pattern.compile("(?i)\\b" + store + "\\b").matcher(text).find()) {
                return store;
            }
        }
        
        Matcher matcher = Pattern.compile("\\b([A-Z][a-z]+)\\b").matcher(text);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return "Unknown";
    }

    public static String extractCouponCode(String text) {
        if (text == null) return "";
        Matcher matcher = Pattern.compile("\\b([A-Z0-9]{5,15})\\b").matcher(text);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return "";
    }

    public static String extractDiscount(String text) {
        if (text == null) return "";
        
        Matcher percentMatcher = Pattern.compile("(\\d{1,2}%\\s*(?:OFF|off|Off))").matcher(text);
        if (percentMatcher.find()) return percentMatcher.group(1);

        Matcher flatMatcher = Pattern.compile("(?:₹|Rs\\.?)\\s*(\\d+)\\s*(?:OFF|off|Off)").matcher(text);
        if (flatMatcher.find()) return "₹" + flatMatcher.group(1) + " OFF";

        Matcher bogoMatcher = Pattern.compile("(?i)(buy\\s*1\\s*get\\s*1|bogo)").matcher(text);
        if (bogoMatcher.find()) return "BOGO";

        return "";
    }

    public static String extractExpiry(String text) {
        if (text == null) return "";
        
        Matcher dateMatcher = Pattern.compile("(\\d{2}[-/]\\d{2}[-/]\\d{2,4})").matcher(text);
        if (dateMatcher.find()) return dateMatcher.group(1);

        Matcher textDateMatcher = Pattern.compile("(?i)(?:valid till|expires on|expiry)\\s*:\\s*([A-Za-z]+\\s*\\d{1,2},?\\s*\\d{4})").matcher(text);
        if (textDateMatcher.find()) return textDateMatcher.group(1);

        return "";
    }

    public static String detectCategory(String store, String text) {
        String lowerStore = store.toLowerCase();
        String lowerText = text.toLowerCase();

        if (lowerStore.matches(".*(swiggy|zomato|dominos|pizzahut|kfc|mcdonalds|bigbasket|blinkit|zepto).*") || 
            lowerText.matches(".*(food|meal|grocery|restaurant|pizza|burger).*")) {
            return "Food & Groceries";
        }

        if (lowerStore.matches(".*(myntra|ajio|nykaa).*") || 
            lowerText.matches(".*(fashion|clothing|shoes|beauty|makeup).*")) {
            return "Fashion & Beauty";
        }

        if (lowerStore.matches(".*(amazon|flipkart).*") || 
            lowerText.matches(".*(electronics|mobile|laptop|gadget).*")) {
            return "Electronics";
        }

        if (lowerStore.matches(".*(makemytrip|goibibo|uber|ola).*") || 
            lowerText.matches(".*(travel|flight|hotel|cab|ride).*")) {
            return "Travel & Rides";
        }

        return "Others";
    }
}
