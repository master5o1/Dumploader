var fs = require('fs');
var storage = require('../storage');
var user_storage = require('../user_storage');
var url = require('url');
var site = require('../site_strings');
var Mongolian = require("mongolian");
/*
 * GET /paste
 */
exports.form = function(req, res){
    var req_url = url.parse(req.url, true);
    show_error = 'false';
    error = '';
    if (typeof req_url.query.error != undefined) {
        show_error = 'true';
        error = req_url.query.error;
    }
    var extensions = [
        //'txt', // this is already written and 'selected' in paste.jade
        'js',
        'php',
        'json',
    ];
    res.render('pastebin/form', {
        site: site.site,
        current_user: site.current_user(req),
        tagline: 'Paste It Here',
        show_error: show_error,
        error: error,
        file_extensions: extensions
    })
};

/*
 * POST /paste
 */
exports.handler = function(req, res) {
    if (req.body.pasted_text.length == 0) {
        res.redirect('/paste?error=Try entering some text this time.')
    } else {
        var name = ((req.body.pasted_title != '') ? req.body.pasted_title : 'untitled');
        var extension = '.' + req.body.pasted_type;
        var contentTypes = {
            txt: 'text/plain',
            js: 'application/javascript',
            php: 'application/x-php',
            json: 'application/json',
        };
        var paste = {
            name: name + extension,
            text: req.body.pasted_text,
            contentType: contentTypes[req.body.pasted_type]
        }
        var current_user = site.current_user(req);
	    if (typeof current_user == 'undefined') { current_user = { _id: null } }
        paste.author_id = current_user._id;
        storage.add_paste(paste, function(file){ 
            res.redirect('/info/' + file._id.bytes.toString('base64').replace('/','-'))
        });
    }
};

/*
 * GET /paste/:id/:name?
 */
exports.view = function(req, res) {
    var file_id = new Buffer(req.params.id.replace('-','/'), 'base64');
    storage.get_file(file_id, function(file) {
        var reply_title = file.filename;
        if (reply_title.substr(0, "Re: ".length) != "Re: ") reply_title = "Re: " + reply_title;
        var types_regex = /^text.*$|^.*json|^.*javascript$|^.*php$/;
        var comments = [];
        var comment_ids = [];
        if ( file.contentType.match(types_regex) ) {
            if (typeof file.metadata.comments == 'undefined' || file.metadata.comments.length == 0) {
                var stream = file.readStream()
                stream.on('data', function(data){
                    var paste = data.toString();
                    var lines = paste.replace(/\r/g,'').replace(/\n/g,'\r\n').split('\n');
                    var lines_data = [];
                    lines.forEach(function(element, index) {
                        this[index] = element.replace('\r','\r\n');
                    }, lines_data);
                    file.metadata.views++;
                    file.save();
                    user_storage.user.findOne({_id: file.metadata.author_id}, function(err, user) {
                        if (!user) { user = { username: 'anonymous' }; }
                        res.render('pastebin/view', {
                            site: site.site,
                            current_user: site.current_user(req),
                            tagline: 'Lines Numbered For Your Viewing Pleasure',
                            file_id: req.params.id,
                            file_name: file.filename,
                            lines: lines_data,
                            paste_data: paste,
                            file: {
                                author: user,
                                name: file.filename,
                                id: file._id.bytes.toString('base64').replace('/','-'),
                                reply_title: reply_title,
                                comment_count: 0,
                                comments: comments
                            },
                            host: req.headers.host
                        })
                    });
                });
            } else {
                var stream = file.readStream()
                stream.on('data', function(data){
                    var paste = data.toString();
                    var lines = paste.replace(/\r/g,'').replace(/\n/g,'\r\n').split('\n');
                    var lines_data = [];
                    lines.forEach(function(element, index) {
                        this[index] = element.replace('\r','\r\n');
                    }, lines_data);
                    file.metadata.views++;
                    file.save();
                    file.metadata.comments.reverse().forEach(function(comment_id, index, array) {
                        comment_ids.unshift(comment_id.bytes.toString('base64').replace('/','-'));
                    }, comments);
                    user_storage.user.findOne({_id: file.metadata.author_id}, function(err, user) {
                        if (!user) { user = { username: 'anonymous' }; }
                        res.render('pastebin/view', {
                            site: site.site,
                            current_user: site.current_user(req),
                            tagline: 'Lines Numbered For Your Viewing Pleasure',
                            file_id: req.params.id,
                            file_name: file.filename,
                            lines: lines_data,
                            paste_data: paste,
                            file: {
                                author: user,
                                name: file.filename,
                                id: file._id.bytes.toString('base64').replace('/','-'),
                                reply_title: reply_title,
                                comment_count: comment_ids.length,
                                comment_ids: JSON.stringify(comment_ids).replace(/\"/g,"'")
                            },
                            host: req.headers.host
                        })
                    });
                });
            }
        } else {
            name_param = '';
            if (typeof req.params.name != undefined) {
                name_param = '/' + req.params.name;
            }
            res.redirect('/view/' + req.params.id + name_param);
        }
    });
};

/*
 * POST /comment/:id
 */
exports.comment = function(req, res) {
    if (req.body.comment_text.length == 0) {
        if (typeof req.query.paste != 'undefined' && req.query.paste == 'true') {
            res.redirect('/paste/' + req.params.id + '?error=Try entering some text this time.')
        } else {
            res.redirect('/info/' + req.params.id + '?error=Try entering some text this time.')
        }
    } else {
        var file_id = new Buffer(req.params.id.replace('-','/'), 'base64');
        storage.gridfs.findOne({_id: new Mongolian.ObjectId(file_id)}, function (err, file) {
            if (!err && file) {
                var name = ((req.body.comment_title != '') ? req.body.comment_title : 'untitled');
                var comments = 0;
                if (typeof file.metadata.comments != 'undefined') comments = file.metadata.comments.length;
                var current_user = site.current_user(req);
                if (typeof current_user == 'undefined') { current_user = { _id: null } }
                var paste = {
                    author: 'author_something',
                    author_id: current_user._id,
                    name: name,
                    text: req.body.comment_text,
                    contentType: 'text/plain',
                }
                storage.add_paste(paste, function(comment_file){
                    if (typeof file.metadata.comments == 'undefined') file.metadata.comments = [];
                    file.metadata.comments.push(comment_file._id); // .bytes.toString('base64')
                    file.save();
                    if (typeof req.query.paste != 'undefined' && req.query.paste == 'true') {
                        res.redirect('/paste/' + req.params.id + '/' + file.filename + '#' + comment_file._id.bytes.toString('base64').replace('/','-'))
                    } else {
                        res.redirect('/info/' + req.params.id + '/' + file.filename + '#' + comment_file._id.bytes.toString('base64').replace('/','-'))
                    }
                });
            } else {
                if (typeof req.query.paste != 'undefined' && req.query.paste == 'true') {
                    res.redirect('/paste/' + req.params.id + '/' + file.filename + '?error=Something went wrong.')
                } else {
                    res.redirect('/info/' + req.params.id + '/' + file.filename + '?error=Something went wrong.')
                }
            }
        });
    }
};
 /*
exports.comment = function(req, res) {
    if (req.body.comment_text.length == 0) {
        if (typeof req.query.paste != 'undefined' && req.query.paste == 'true') {
            res.redirect('/paste/' + req.params.id + '?error=Try entering some text this time.')
        } else {
            res.redirect('/info/' + req.params.id + '?error=Try entering some text this time.')
        }
    } else {
        var file_id = new Buffer(req.params.id.replace('-','/'), 'base64');
        storage.gridfs.findOne({_id: new Mongolian.ObjectId(file_id)}, function (err, file) {
            if (!err && file) {
                var name = ((req.body.comment_title != '') ? req.body.comment_title : 'untitled');
                var comments = 0;
                if (typeof file.metadata.comments != 'undefined') comments = file.metadata.comments.length;
                var current_user = site.current_user(req);
	    		if (typeof current_user == 'undefined') { current_user = { _id: null } }
                var paste = {
                    author_id: current_user._id,
                    name: name,
                    text: req.body.comment_text,
                    contentType: 'text/plain',
                }
                storage.add_paste(paste, function(comment_file){
                    if (typeof file.metadata.comments == 'undefined') file.metadata.comments = [];
                    file.metadata.comments.push(new Buffer(comment_file._id.bytes.toString('base64'), 'base64'));
                    file.save();
                    if (typeof req.query.paste != 'undefined' && req.query.paste == 'true') {
                        res.redirect('/paste/' + req.params.id + '/' + file.filename + '#' + comment_file._id.bytes.toString('base64').replace('/','-'))
                    } else {
                        res.redirect('/info/' + req.params.id + '/' + file.filename + '#' + comment_file._id.bytes.toString('base64').replace('/','-'))
                    }
                });
            } else {
                if (typeof req.query.paste != 'undefined' && req.query.paste == 'true') {
                    res.redirect('/paste/' + req.params.id + '/' + file.filename + '?error=Something went wrong.')
                } else {
                    res.redirect('/info/' + req.params.id + '/' + file.filename + '?error=Something went wrong.')
                }
            }
        });
    }
};*/
