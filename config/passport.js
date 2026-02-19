const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User, Provider } = require('../models');

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists
                let user = await User.findOne({ where: { googleId: profile.id } });

                if (user) {
                    return done(null, user);
                }

                // Check if user exists with email (link account)
                user = await User.findOne({ where: { email: profile.emails[0].value } });

                if (user) {
                    user.googleId = profile.id;
                    user.profilePicture = profile.photos[0].value;
                    await user.save();
                    return done(null, user);
                }

                // Create new user
                user = await User.create({
                    googleId: profile.id,
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    profilePicture: profile.photos[0].value,
                    role: 'user', // Default role
                });

                // Auto-create provider profile if needed (though new users default to 'user')
                // If we want to allow Google sign-up for providers, we'd need a way to pass that info.
                // For now, default to 'user' is safe.

                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

module.exports = passport;
