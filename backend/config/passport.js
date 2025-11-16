import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

passport.serializeUser((user, done) => done(null, user.id || user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).lean();
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails && profile.emails[0] && profile.emails[0].value;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        provider: "google",
        googleId: profile.id,
        email,
        name: profile.displayName
      });
    } else {
      if (!user.googleId) {
        user.googleId = profile.id;
        await user.save();
      }
    }
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));
