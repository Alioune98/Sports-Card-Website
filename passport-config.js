const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

//A function defined in passport-config to initialize passport
async function initialize(passport, getUserByEmail, getUserById) {
  const authenticateUser = async (email, password, done) => {
    const user = await getUserByEmail(email);
    if (user.length == 0) {
      return done(null, false, { message: 'No user with that email' });
    }
    try {
      if (await bcrypt.compare(password, user[0].password)) {
        console.log(user);
        console.log(user[0].user_id);
        return done(null, user);
      } else {
        return done(null, false, { message: 'Password incorrect' });
      }
    } catch (e) {
      return done(e);
    }
  };

  await passport.use(
    new LocalStrategy({ usernameField: 'email' }, authenticateUser)
  );

  passport.serializeUser((user, done) => done(null, user[0].user_id));
  passport.deserializeUser((id, done) => {
    return done(null, getUserById(id));
  });
}

module.exports = initialize;
