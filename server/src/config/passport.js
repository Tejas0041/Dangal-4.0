import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Hall from '../models/Hall.js';

// Load environment variables
dotenv.config();

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      hd: 'students.iiests.ac.in', // Restrict to IIEST G Suite domain
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        
        // Validate email domain (double check even with hd parameter)
        if (!email.endsWith('@students.iiests.ac.in')) {
          return done(new Error('Only IIEST G Suite accounts are allowed'), null);
        }

        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // Check if the email is a JMCR email
        const hall = await Hall.findOne({ 'jmcr.gsuite': email });
        
        if (!hall) {
          // Not a JMCR - reject registration
          return done(new Error('JMCR_ONLY'), null);
        }

        // Create new user (only if JMCR)
        user = await User.create({
          googleId: profile.id,
          email: email,
          name: profile.displayName,
          avatar: profile.photos[0]?.value,
          role: 'user', // Default role
        });

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

export default passport;
