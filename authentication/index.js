var passport = require('passport')
    , GoogleStrategy = require('passport-google').Strategy
    , LocalStrategy = require('passport-local').Strategy
    , storage = require("../user_storage.js")
    , site = require('../site_strings');
    

exports.serializeUser = function(user, done) {
    done(null, user.id);
}

exports.deserializeUser = function(id, done) {
    storage.user.findOne({id: id}, function (err, user) {
        done(err, user);
    });
}

exports.googleStrategy = new GoogleStrategy({
        returnURL: site.site.site_url + '/auth/google/return',
        realm: site.site.site_url + '/'
    },
    function(identifier, profile, done) {
        console.log(identifier);
        console.log(profile);
        storage.user.findOrCreate({ search: { provider: 'openId', id: identifier }, profile: profile}, function (err, user) {
            done(err, user);
        });
    }
);

exports.localStrategy = new LocalStrategy(
  function(username, password, done) {
    storage.user.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Unknown user' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Invalid password' });
      }
      return done(null, user);
    });
  }
)

exports.login_route = function(req, res) {
    res.render('login', {
        site: site.site,
        current_user: site.current_user(req),
        tagline: 'Login',
        
    });
}
