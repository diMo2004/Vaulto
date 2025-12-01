import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const displayName = profile.displayName;

        let user = await User.findOne({ email });

        // First time Google login
        if (!user) {
          user = await User.create({
            provider: "google",
            googleId: profile.id,
            email,
            name: displayName,
            username: displayName
              ? displayName.toLowerCase().replace(/\s+/g, "_")
              : undefined,
            avatar: profile.photos?.[0]?.value || "",
            gender: "", // Google usually doesn't provide this with basic scopes
            dob: "",
          });
        } else {
          // Already exists (maybe from email signup) – attach googleId if missing
          if (!user.googleId) {
            user.googleId = profile.id;
            user.provider = "google";
            await user.save();
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});