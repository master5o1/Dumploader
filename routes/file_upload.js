var fs = require('fs');
var storage = require('../storage');
var site = require('../site_strings').site;
var url = require('url');
var Mongolian = require("mongolian");
/*
 * GET /upload
 */
exports.form = function(req, res){
    var req_url = url.parse(req.url, true);
    var show_error = 'false';
    var error = '';
    if (typeof req_url.query.error != undefined) {
        show_error = 'true';
        error = req_url.query.error;
    }
    if (true) { // off by defualt because it loads full size images coz I haven't got thumbnails sorted.
        recent_images = storage.gridfs.find({contentType: /^image\/.*/}, {_id: 1, filename: 1, uploadDate: 1}).sort({uploadDate: -1}).limit(9);
        recent_images.toArray(function(err, recent){
            var r_images = [];
            recent.forEach(function(element){
                this.push({id: element._id.bytes.toString('base64').replace('/','-'), name: element.filename, title: element.uploadDate});
            }, r_images);
            var meta = storage.db.collection('fs.meta');
            most_viewed = storage.gridfs.find({contentType: /^image\/.*/}, {_id: 1, filename: 1, metadata: 1}).sort({"metadata.views": -1, uploadDate: -1}).limit(9);
            most_viewed.toArray(function(err,most) {
                var m_images = [];
                most.forEach(function(element){
                    var viewsCount = element.metadata.views + ' view' + ((element.metadata.views == 1)? '' : 's');
                    this.push({id: element._id.bytes.toString('base64').replace('/','-'), name: element.filename, title: viewsCount});
                }, m_images);
                res.render('file/form', {
                    site: site,
                    tagline: 'Upload A File',
                    featured_images: { most: m_images, last: r_images },
                    show_error: show_error,
                    error: error,
                })
            });
        });
    } else {
        var images = [];
        res.render('file/form', {
            site: site,
            tagline: 'Upload A File',
            featured_images: { top: images, last: images },
            show_error: show_error,
            error: error,
        })
    }
};

/*
 * POST /upload
 */
exports.upload = function(req, res) {
    fs.readFile(req.files.uploaded_file.path, function (err, data) {
        if (err || (req.files.uploaded_file.name == '' && req.files.uploaded_file.size == 0)) {
            res.redirect('/upload/?error=Dunno what happened there.');
        } else {
            req.files.uploaded_file.author = req.body.file_author;
            storage.add_file(req.files.uploaded_file, function(file){
                res.redirect('/info/' + file._id.bytes.toString('base64').replace('/','-') + '/' + file.filename);
            });
        }
    });
};

/*
 * GET /random
 */
exports.random = function(req, res){
    storage.db.collection('fs.files').count(function(e,count){
        if (count <= 0) {
            res.redirect('/');
            return;
        }
        var skip = Math.floor(Math.random()*(count));
        storage.gridfs.find({},{"filename":1}).skip(skip).limit(1).toArray(function(err, files) {
            var types_regex = /^text.*$|^.*json|^.*javascript$|^.*php$/;
            if (files[0].contentType.match(types_regex)) {
                res.redirect('/paste/' + files[0]._id.bytes.toString('base64').replace('/','-') + '/' + files[0].filename);
            } else {
                res.redirect('/info/' + files[0]._id.bytes.toString('base64').replace('/','-') + '/' + files[0].filename);
            }
        });
    });
}

/*
 * GET /info/:id/:filename?
 */
exports.info = function(req, res){
    var file_id = new Buffer(req.params.id.replace('-','/'), 'base64');
    storage.get_file(file_id, function(file) {
        var file_size = (function(size) {
            if (size < 1024) return size + ' B';
            units = ['B', 'K', 'M', 'G', 'T', 'P'];
            while (size >= 1024) {
                size = size / 1024;
                units.shift();
            }
            return parseInt(size*100)/100 + ' ' + units.shift() + 'iB';
        })(file.length);
        var reply_title = file.filename;
        if (reply_title.substr(0, "Re: ".length) != "Re: ") reply_title = "Re: " + reply_title;
        var types_regex = /^text.*$|^.*json|^.*javascript$|^.*php$/;
        var comments = [];
        if (typeof file.metadata.comments == 'undefined' || file.metadata.comments.length == 0) {
            res.render('file/info', {
                site: site,
                tagline: 'File Information',
                image: ((file.contentType.match(/^image.*/)) ? 'true' : 'false'),
                paste: ((file.contentType.match(types_regex)) ? 'true' : 'false'),
                bytes_suffix: ((file.length == 1)? 'byte' : 'bytes'),
                file: {
                    author: file.metadata.author,
                    name: file.filename,
                    id: file._id.bytes.toString('base64').replace('/','-'),
                    date: file.uploadDate,
                    md5: file.md5,
                    size: file_size,
                    length: file.length,
                    type: file.contentType,
                    views: file.metadata.views,
                    reply_title: reply_title,
                    comments: []
                },
                host: req.headers.host,
            });
        } else {
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
                                res.render('file/info', {
                                    site: site,
                                    tagline: 'File Information',
                                    image: ((file.contentType.match(/^image.*/)) ? 'true' : 'false'),
                                    paste: ((file.contentType.match(types_regex)) ? 'true' : 'false'),
                                    bytes_suffix: ((file.length == 1)? 'byte' : 'bytes'),
                                    file: {
                                        author: file.metadata.author,
                                        name: file.filename,
                                        id: file._id.bytes.toString('base64').replace('/','-'),
                                        date: file.uploadDate,
                                        md5: file.md5,
                                        size: file_size,
                                        length: file.length,
                                        type: file.contentType,
                                        views: file.metadata.views,
                                        reply_title: reply_title,
                                        comments: comments
                                    },
                                    host: req.headers.host,
                                });
                            }
                        });
                    }
                });
            }, comments);
        }
    });
};

/*
 * GET /view/:id/:filename?
 */
exports.view = function(req, res){
    var file_id = new Buffer(req.params.id.replace('-','/'), 'base64');
    storage.get_file(file_id, function(file) {
        var stream = file.readStream();
        if (!!req.headers['if-modified-since']) {
            res.statusCode = 304;
        }
        res.setHeader('Date', (new Date()).toUTCString());
        res.setHeader('Last-Modified', (new Date(file.uploadDate)).toUTCString());
        res.setHeader('Cache-Control', 'public, max-age=' + (60*525600));
        res.setHeader('Content-Type', file.contentType);
        if (!req.headers['if-modified-since']) {
            file.metadata.views++;
            file.save();
            var stream = file.readStream();
            stream.on('data', function (chunk) {
                res.write(chunk);
            });
            stream.on('end', function() {
                res.end();
            })
        } else { res.end(); }
    });
};

/*
 * GET /thumb/:id/:filename?
 */
exports.thumb = function(req, res){
    var file_id = new Buffer(req.params.id.replace('-','/'), 'base64');
    storage.get_file(file_id, function(file) {
        if (file.contentType.match(/^image\/.*/)) {
            storage.get_thumb(file_id, function(thumb) {
                if (!!req.headers['if-modified-since']) {
                    res.statusCode = 304;
                }
                res.setHeader('Date', (new Date()).toUTCString());
                res.setHeader('Last-Modified', (new Date(thumb.uploadDate)).toUTCString());
                res.setHeader('Cache-Control', 'public, max-age=' + (60*525600));
                res.setHeader('Content-Type', thumb.contentType);
                if (!req.headers['if-modified-since']) {
                    var stream = thumb.readStream();
                    stream.on('data', function (chunk) {
                        res.write(chunk);
                    });
                    stream.on('end', function() {
                        res.end();
                    })
                } else { res.end(); }
            });
        } else {
            var name = ((typeof req.params.name != undefined && req.params.name != '') ? '/' + req.params.name : '');
            res.redirect('/view/' + req.params.id + name);
        }
    });
};

/*
 * GET /list/files/
 */
exports.list = function(req, res){
    var skip = req.params.skip;
    var limit = 25;
    if (typeof skip == undefined || skip == undefined || skip == 'undefined' || skip <= 0) skip = 0;
    file_list = storage.gridfs.find({}, {_id: 1, filename: 1, uploadDate: 1, length: 1, metadata: 1}).sort({uploadDate: -1}).skip(skip).limit(limit);
    file_list.toArray(function(err, value){
        var current_count = value.length;
        var file_list = [];
        value.forEach(function(element){
            var file_size = (function(size) {
                if (size < 1024) return size + ' B';
                units = ['B', 'K', 'M', 'G', 'T', 'P'];
                while (size >= 1024) {
                    size = size / 1024;
                    units.shift();
                }
                return parseInt(size*100)/100 + ' ' + units.shift() + 'iB';
            })(element.length);
            element.uploadDate = (function(uploadDate){
                var element = {uploadDate: uploadDate};
                var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                var date = element.uploadDate.getUTCDate() + ' ' + months[element.uploadDate.getUTCMonth()] + ' '
                        + element.uploadDate.getUTCFullYear() + ' '
                        + ((element.uploadDate.getUTCHours().toString().length == 1)?"0"+element.uploadDate.getUTCHours():element.uploadDate.getUTCHours()) + ':'
                        + ((element.uploadDate.getUTCMinutes().toString().length == 1)?"0"+element.uploadDate.getUTCMinutes():element.uploadDate.getUTCMinutes()) + ':'
                        + ((element.uploadDate.getUTCSeconds().toString().length == 1)?"0"+element.uploadDate.getUTCSeconds():element.uploadDate.getUTCSeconds());
                return date;
            })(element.uploadDate);
            this.push({file_id: element._id.bytes.toString('base64').replace('/','-'), file_name: element.filename, file_date: element.uploadDate, file_size: file_size, file_views: element.metadata.views});
        }, file_list);
        res.render('file/list', {
            site: site,
            tagline: 'List of Uploaded Files',
            file_list: file_list,
            host: req.headers.host,
            show_next: ((current_count == limit)? true : false),
            next_skip: (limit + parseInt(skip)),
            limit: limit,
        });
    });
};
