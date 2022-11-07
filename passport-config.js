const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

async function initializePassport(passport, getUserByEmail, getUserById) {
  const authenticateUser = async (email, password, done) => {
    const user = await getUserByEmail(email);
    if (user.length == 0) {
      return done(null, false, { message: 'No user with that email' });
    }
    try {
      if (await bcrypt.compare(password, user[0].password)) {
        return done(null, user[0].user_id);
      } else {
        return done(null, false, { message: 'Password incorrect' });
      }
    } catch (e) {
      return done(e);
    }
  };

  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((id, done) => {
    return done(null, getUserById(id));
  });
}

module.exports = initializePassport;
