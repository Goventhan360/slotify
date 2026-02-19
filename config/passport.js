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
                const email = profile.emails[0].value;

                // 1. Check if user exists with this email
                let user = await User.findOne({ where: { email } });

                if (!user) {
                    // USER NOT REGISTERED -> BLOCK LOGIN
                    return done(null, false, {
                        message: 'Email not registered. Access denied.',
                    });
                }

                // 2. User exists -> Ensure Google ID is linked
                if (!user.googleId) {
                    user.googleId = profile.id;
                    if (!user.profilePicture) {
                        user.profilePicture = profile.photos[0].value;
                    }
                    await user.save();
                }

                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

module.exports = passport;
