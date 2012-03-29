var fs = require('fs');
var storage = require('../storage');
var site = require('../site_strings').site;
var url = require('url');

var crypto = require('crypto');
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
        recent_images = storage.gridfs.find({contentType: /^image\/[^gif].*/}, {aliases: 1, filename: 1, metadata: 1}).sort({uploadDate: -1}).limit(9);
        recent_images.toArray(function(err, recent){
            var r_images = [];
            recent.forEach(function(element){
                this.push({id: element.aliases.toString(36), name: element.filename});
            }, r_images);
            var meta = storage.db.collection('fs.meta');
            most_viewed = storage.gridfs.find({contentType: /^image\/[^gif].*/}, {aliases: 1, filename: 1, metadata: 1}).sort({"metadata.views": -1, uploadDate: -1}).limit(9);
            most_viewed.toArray(function(err,most) {
                var m_images = [];
                most.forEach(function(element){
                    this.push({id: element.aliases.toString(36), name: element.filename});
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
            storage.add_file(req.files.uploaded_file, function(file){
                res.redirect('/info/' + file.aliases.toString(36) + '/' + file.filename);
            });
        }
    });
};

/*
 * GET /info/:id/:filename?
 */
exports.info = function(req, res){
    var file_id = parseInt(req.params.id, 36);
    storage.get_file(file_id, function(file) {
        file_size = (function(size) {
            if (size < 1024) return size + ' B';
            units = ['B', 'K', 'M', 'G', 'T', 'P'];
            while (size >= 1024) {
                size = size / 1024;
                units.shift();
            }
            return parseInt(size*100)/100 + ' ' + units.shift() + 'iB';
        })(file.length);
        var types_regex = /^text.*$|^.*json|^.*javascript$|^.*php$/;
        res.render('file/info', {
            site: site,
            tagline: 'File Information',
            image: ((file.contentType.match(/^image.*/)) ? 'true' : 'false'),
            paste: ((file.contentType.match(types_regex)) ? 'true' : 'false'),
            bytes_suffix: ((file.length == 1)? 'byte' : 'bytes'),
            file: {
                name: file.filename,
                id: file.aliases.toString(36),
                date: file.uploadDate,
                md5: file.md5,
                size: file_size,
                length: file.length,
                type: file.contentType,
                views: file.metadata.views,
            },
            host: req.headers.host,
        });
    })
};

/*
 * GET /view/:id/:filename?
 */
exports.view = function(req, res){
    var file_id = parseInt(req.params.id, 36);
    storage.get_file(file_id, function(file) {
        file.metadata.views++;
        file.save();
        var stream = file.readStream()
        res.setHeader("Content-Type", file.contentType);
        stream.pipe(res)
    });
};

/*
 * GET /thumb/:id/:filename?
 */
exports.thumb = function(req, res){
    var file_id = parseInt(req.params.id, 36);
    storage.get_file(file_id, function(file) {
        if (file.contentType.match(/^image\/.*/)) {
            storage.get_thumb(file_id, function(thumb) {
                var stream = thumb.readStream()
                res.setHeader("Content-Type", thumb.contentType);
                stream.pipe(res)
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
    file_list = storage.gridfs.find({}, {aliases: 1, filename: 1, uploadDate: 1, length: 1, metadata: 1}).sort({uploadDate: -1}).skip(skip).limit(limit);
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
            var date = element.uploadDate.getUTCDate() + ' ' + months[element.uploadDate.getUTCMonth()-1] + ' '
                    + element.uploadDate.getUTCFullYear() + ' '
                    + ((element.uploadDate.getUTCHours().toString().length == 1)?"0"+element.uploadDate.getUTCHours():element.uploadDate.getUTCHours()) + ':'
                    + ((element.uploadDate.getUTCMinutes().toString().length == 1)?"0"+element.uploadDate.getUTCMinutes():element.uploadDate.getUTCMinutes()) + ':'
                    + ((element.uploadDate.getUTCSeconds().toString().length == 1)?"0"+element.uploadDate.getUTCSeconds():element.uploadDate.getUTCSeconds());
            return date;
            })(element.uploadDate);
            this.push({file_id: element.aliases.toString(36), file_name: element.filename, file_date: element.uploadDate, file_size: file_size, file_views: element.metadata.views});
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