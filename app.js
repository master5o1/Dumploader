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
  app.set('view options', { pretty: true });
  app.use(express.bodyParser());
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

// ROUTES:
// Redirects
app.get('/info', function(req, res){ res.redirect('/'); });
app.get('/view', function(req, res){ res.redirect('/'); });

// Search
app.get('/search/:skip?', routes.item.find);
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

// Other pages
app.get('/page', routes.pages.index);
app.get('/page/:name', routes.pages.run);

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
