import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { AuthService } from '../services/auth.js';

// Configure local strategy
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email: string, password: string, done) => {
    try {
      const user = await AuthService.authenticateUser(email, password);
      
      if (!user) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize user for session
passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await AuthService.findUserById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;