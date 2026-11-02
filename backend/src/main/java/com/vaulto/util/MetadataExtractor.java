package com.vaulto.util;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Turns raw OCR text into coupon fields.
 * Category values match the options of the dropdown in the React "Add Coupon" form.
 */
public class MetadataExtractor {

    private static final String[] KNOWN_STORES = {
        "Amazon", "Flipkart", "Myntra", "Ajio", "Swiggy", "Zomato",
        "Uber", "Ola", "MakeMyTrip", "Goibibo", "Nykaa", "BigBasket",
        "Blinkit", "Zepto", "Dominos", "PizzaHut", "KFC", "McDonalds"
    };

    /** All-caps words that look like codes but are just coupon boilerplate. */
    private static final Set<String> CODE_STOPWORDS = Set.of(
        "OFFER", "VALID", "COUPON", "LIMIT", "TERMS", "APPLY", "CONDITIONS", "DETAILS",
        "EXPIRES", "REDEEM", "SPONSORED", "DOMESTIC", "MAXIMUM", "MINIMUM", "ONLY"
    );

    private static final List<String> MONTHS = Arrays.asList(
        "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec");

    public static String extractStore(String text) {
        if (text == null || text.isBlank()) return "Unknown";
        for (String store : KNOWN_STORES) {
            if (Pattern.compile("(?i)\\b" + store + "\\b").matcher(text).find()) {
                return store;
            }
        }

        // Fallback: the first non-empty line that contains letters (usually the brand name).
        for (String line : text.split("\\R")) {
            String trimmed = line.trim();
            if (trimmed.length() >= 2 && trimmed.length() <= 40 && trimmed.matches(".*[A-Za-z].*")) {
                return trimmed;
            }
        }
        return "Unknown";
    }

    public static String extractCouponCode(String text) {
        if (text == null) return "";

        // "use code SAVE20", "Code: WELCOME100"  (keyword is case-insensitive, the code is not)
        Matcher keyword = Pattern.compile("(?i:code|use)\\s*[:\\-]?\\s*([A-Z0-9]{4,15})\\b").matcher(text);
        while (keyword.find()) {
            String candidate = keyword.group(1);
            if (candidate.matches(".*[A-Z].*") && !CODE_STOPWORDS.contains(candidate)) return candidate;
        }

        // Any standalone ALL-CAPS token that contains at least one letter (e.g. TRIPMMT, SAVE20).
        Matcher matcher = Pattern.compile("\\b(?=[A-Z0-9]*[A-Z])([A-Z0-9]{5,15})\\b").matcher(text);
        while (matcher.find()) {
            if (!CODE_STOPWORDS.contains(matcher.group(1))) return matcher.group(1);
        }
        return "";
    }

    public static String extractDiscount(String text) {
        if (text == null) return "";

        Matcher percentMatcher = Pattern.compile("(\\d{1,3}\\s*%\\s*(?i:off))").matcher(text);
        if (percentMatcher.find()) return percentMatcher.group(1);

        Matcher flatMatcher = Pattern.compile("(?:₹|Rs\\.?|INR)\\s*([\\d,]+)\\s*(?i:off)").matcher(text);
        if (flatMatcher.find()) return "₹" + flatMatcher.group(1) + " OFF";

        Matcher bogoMatcher = Pattern.compile("(?i)(buy\\s*1\\s*get\\s*1|bogo)").matcher(text);
        if (bogoMatcher.find()) return "BOGO";

        return "";
    }

    /**
     * Returns the expiry date as "yyyy-MM-dd" (what an HTML date input needs), or "" if none found.
     * Understands "Expires on February 1, 2026", "Valid till 01/02/2026", "1st Feb 2026", ...
     */
    public static String extractExpiry(String text) {
        LocalDate date = extractExpiryDate(text);
        return date == null ? "" : date.toString();
    }

    public static LocalDate extractExpiryDate(String text) {
        if (text == null || text.isBlank()) return null;

        // 1) A date that follows an "expires / valid till" style keyword.
        Matcher keyword = Pattern.compile(
            "(?i)(?:expires?|expiry|valid\\s*(?:till|until|through|upto|up\\s*to)|ends?)\\s*(?:on|by)?\\s*[:\\-]?\\s*([^\\n]{0,40})")
            .matcher(text);
        while (keyword.find()) {
            LocalDate d = parseDate(keyword.group(1));
            if (d != null) return d;
        }

        // 2) Otherwise the first date found anywhere in the text.
        return parseDate(text);
    }

    private static LocalDate parseDate(String s) {
        if (s == null) return null;
        try {
            // 01/02/2026, 01-02-26  (day first - Indian format)
            Matcher numeric = Pattern.compile("\\b(\\d{1,2})[/\\-.](\\d{1,2})[/\\-.](\\d{2,4})\\b").matcher(s);
            if (numeric.find()) {
                int year = Integer.parseInt(numeric.group(3));
                if (year < 100) year += 2000;
                return LocalDate.of(year, Integer.parseInt(numeric.group(2)), Integer.parseInt(numeric.group(1)));
            }

            // February 1, 2026 / Feb 1st 2026
            Matcher monthFirst = Pattern.compile("\\b([A-Za-z]{3,9})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b").matcher(s);
            while (monthFirst.find()) {
                int month = MONTHS.indexOf(monthFirst.group(1).substring(0, 3).toLowerCase()) + 1;
                if (month > 0) {
                    return LocalDate.of(Integer.parseInt(monthFirst.group(3)), month, Integer.parseInt(monthFirst.group(2)));
                }
            }

            // 1 February 2026 / 1st Feb, 2026
            Matcher dayFirst = Pattern.compile("\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+([A-Za-z]{3,9})\\.?,?\\s+(\\d{4})\\b").matcher(s);
            while (dayFirst.find()) {
                int month = MONTHS.indexOf(dayFirst.group(2).substring(0, 3).toLowerCase()) + 1;
                if (month > 0) {
                    return LocalDate.of(Integer.parseInt(dayFirst.group(3)), month, Integer.parseInt(dayFirst.group(1)));
                }
            }
        } catch (DateTimeException | NumberFormatException ignored) {
            // impossible date such as 31/02/2026 - treat as "not found"
        }
        return null;
    }

    private static boolean containsAny(String haystack, String... needles) {
        for (String needle : needles) {
            if (haystack.contains(needle)) return true;
        }
        return false;
    }

    /** Returns one of the dropdown values of the Add Coupon form. */
    public static String detectCategory(String store, String text) {
        String s = store == null ? "" : store.toLowerCase();
        String t = text == null ? "" : text.toLowerCase();

        if (containsAny(s, "bigbasket", "blinkit", "zepto") || containsAny(t, "grocery", "groceries", "supermarket")) {
            return "Groceries";
        }
        if (containsAny(s, "swiggy", "zomato", "dominos", "pizzahut", "kfc", "mcdonalds")
                || containsAny(t, "food", "meal", "restaurant", "pizza", "burger")) {
            return "Food";
        }
        if (containsAny(s, "makemytrip", "goibibo", "uber", "ola")
                || containsAny(t, "travel", "flight", "hotel", "cab ", "ride", "booking")) {
            return "Travel";
        }
        if (containsAny(s, "nykaa") || containsAny(t, "beauty", "makeup", "skincare", "cosmetic")) {
            return "Beauty";
        }
        if (containsAny(s, "amazon", "flipkart") || containsAny(t, "electronics", "mobile", "laptop", "gadget")) {
            return "Electronics";
        }
        return "Other";
    }

    public static com.vaulto.dto.CouponRequest extractCouponData(String text) {
        com.vaulto.dto.CouponRequest request = new com.vaulto.dto.CouponRequest();
        request.setStore(extractStore(text));
        request.setCode(extractCouponCode(text));
        request.setDiscount(extractDiscount(text));
        request.setCategory(detectCategory(request.getStore(), text));

        LocalDate expiry = extractExpiryDate(text);
        if (expiry != null) {
            request.setExpiry(Date.from(expiry.atStartOfDay(ZoneId.systemDefault()).toInstant()));
        }
        request.setRawText(text);
        return request;
    }
}
