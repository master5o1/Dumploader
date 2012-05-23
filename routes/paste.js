var fs = require('fs');
var storage = require('../storage');
var url = require('url');
var site = require('../site_strings').site;
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
        site: site,
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
            author: req.body.paste_author,
            name: name + extension,
            text: req.body.pasted_text,
            contentType: contentTypes[req.body.pasted_type]
        }
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
                    res.render('pastebin/view', {
                        site: site,
                        tagline: 'Lines Numbered For Your Viewing Pleasure',
                        file_id: req.params.id,
                        file_name: file.filename,
                        lines: lines_data,
                        paste_data: paste,
                        file: {
                            author: file.metadata.author,
                            name: file.filename,
                            id: file._id.bytes.toString('base64').replace('/','-'),
                            reply_title: reply_title,
                            comments: comments
                        },
                        host: req.headers.host
                    })
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
                        storage.gridfs.findOne({_id: new Mongolian.ObjectId(comment_id)}, function (err, comment_file) {
                            if (!err && comment_file) {
                                var replies = 0;
                                if (typeof comment_file.metadata.comments != 'undefined') replies = comment_file.metadata.comments.length;
                                var comment = {
                                    id: comment_file._id.bytes.toString('base64').replace('/','-'),
                                    title: comment_file.filename,
                                    author: comment_file.metadata.author,
                                    date: comment_file.uploadDate,
                                    text: null,
                                    replies: replies,
                                    reply: (replies==1)? 'reply':'replies'
                                };
                                comment.date = (function(uploadDate){
                                    var element = {uploadDate: uploadDate};
                                    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                    var date = element.uploadDate.getUTCDate() + ' ' + months[element.uploadDate.getUTCMonth()] + ' '
                                            + element.uploadDate.getUTCFullYear() + ' '
                                            + ((element.uploadDate.getUTCHours().toString().length == 1)?"0"+element.uploadDate.getUTCHours():element.uploadDate.getUTCHours()) + ':'
                                            + ((element.uploadDate.getUTCMinutes().toString().length == 1)?"0"+element.uploadDate.getUTCMinutes():element.uploadDate.getUTCMinutes()) + ':'
                                            + ((element.uploadDate.getUTCSeconds().toString().length == 1)?"0"+element.uploadDate.getUTCSeconds():element.uploadDate.getUTCSeconds());
                                    return date;
                                })(comment_file.uploadDate);
                                var stream = comment_file.readStream();
                                stream.on('data', function (chunk) {
                                    comment.text = chunk.toString();
                                    comments.push(comment);
                                    if (comments.length == file.metadata.comments.length) {
                                        res.render('pastebin/view', {
                                            site: site,
                                            tagline: 'Lines Numbered For Your Viewing Pleasure',
                                            file_id: req.params.id,
                                            file_name: file.filename,
                                            lines: lines_data,
                                            paste_data: paste,
                                            file: {
                                                author: file.metadata.author,
                                                name: file.filename,
                                                id: file._id.bytes.toString('base64').replace('/','-'),
                                                reply_title: reply_title,
                                                comments: comments
                                            },
                                            host: req.headers.host
                                        })
                                    }
                                });
                            }
                        });
                    }, comments);
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
                var paste = {
                    author: req.body.comment_author,
                    name: name,// + '-comment-' + comments + '.' + req.params.id,
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
};