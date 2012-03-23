
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , storage = require('./storage')
;

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// ROUTES:
// Redirects
app.get('/index', function(req, res){ res.redirect('/'); });
app.get('/info', function(req, res){ res.redirect('/'); });
app.get('/view', function(req, res){ res.redirect('/'); });

// Files
app.get('/', routes.file.form);
app.get('/upload', routes.file.form);
app.post('/upload', routes.file.upload);
app.get('/view/:id/:name?', routes.file.view);
app.get('/info/:id/:name?', routes.file.info);
app.get('/list/files/:limit?', routes.file.list);
app.get('/list', function(req, res){ res.redirect('/list/files'); });

// Links
app.get('/link', routes.link.form);
app.post('/link', routes.link.handler);
app.get('/link/:id', routes.link.redirect);
app.get('/link/:id/info', routes.link.info);
app.get('/list/links/:limit?', routes.link.list);

app.get('/about', routes.about);

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);