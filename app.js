/**
 * Module dependencies.
 */
var express = require('express')
  , routes = require('./routes')
  , storage = require('./storage')
  , authentication = require('./authentication')
  , passport = require('passport');

var app = module.exports = express.createServer();
var port = process.env.port || 1337;

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  //app.set('view options', { pretty: true });
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'my face' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.methodOverride());
  app.use(app.router);
  var oneYear = 31557600000;
  app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Authentication
passport.use(authentication.localStrategy);
passport.use(authentication.googleStrategy);
passport.serializeUser(authentication.serializeUser);
passport.deserializeUser(authentication.deserializeUser);

app.get('/auth/google', passport.authenticate('google'));
app.get('/auth/google/return', passport.authenticate('google', { successRedirect: '/', failureRedirect: '/login' }));
app.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' }));
app.get('/login', authentication.login_route);
app.get('/logout', function(req, res){ req.logOut(); res.redirect('/'); });

// ROUTES:
app.get('/info', function(req, res){ res.redirect('/'); });
app.get('/view', function(req, res){ res.redirect('/'); });

// Users
app.get('/user/:username?', routes.users.profile);
app.get('/user/:username/check_username', routes.users.checkUserName);
app.post('/user/:username/edit', routes.users.changeUserData);

// Search
app.get('/search/:skip?', routes.search.find);
app.get('/random', routes.file.random);

// Files
app.get('/', routes.file.form);
app.get('/upload', routes.file.form);
app.post('/upload', routes.file.upload);
app.get('/view/:id/:name?', routes.file.view);
app.get('/thumb/:id/:name?', routes.file.thumb);
app.get('/info/:id/:name?', routes.file.info);
app.get('/list/files/:skip?', routes.file.list);
app.get('/list', function(req, res){ res.redirect('/list/files'); });

// Links
app.get('/link', routes.link.form);
app.post('/link', routes.link.handler);
app.get('/link/:id', routes.link.redirect);
app.get('/link/:id/info', routes.link.info);
app.get('/list/links/:skip?', routes.link.list);

// Paste
app.get('/paste', routes.paste.form);
app.post('/paste', routes.paste.handler);
app.get('/paste/:id/:name?', routes.paste.view);
app.post('/comment/:id', routes.paste.comment);

// Other pages
app.get('/page', routes.pages.index);
app.get('/page/:name', routes.pages.run);

app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
