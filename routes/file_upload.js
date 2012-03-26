var fs = require('fs');
var storage = require('../storage');

/*
 * GET /upload
 */
exports.form = function(req, res){
    if (false) { // off by defualt because it loads full size images coz I haven't got thumbnails sorted.
        file_list = storage.gridfs.find({contentType: /^image\/[^gif].*/}, {_id: 1, filename: 1}).sort({uploadDate: -1}).limit(5);
        file_list.toArray(function(err, value){
            var images = [];
            value.forEach(function(element){
                this.push({id: element._id.toString(36), name: element.filename});
            }, images);
            res.render('file/form', {
                title: 'dumploader',
                tagline: 'Dump It Here',
                featured_images: images,
            })
        });
    } else {
        var images = [];
        res.render('file/form', {
            title: 'dumploader',
            tagline: 'Dump It Here',
            featured_images: images,
        })
    }
};

/*
 * POST /upload
 */
exports.upload = function(req, res) {
    fs.readFile(req.files.uploaded_file.path, function (err, data) {
        if (err || (req.files.uploaded_file.name == '' && req.files.uploaded_file.size == 0)) {
            res.render('file/form', {
                title: 'dumploader',
                tagline: 'OH Noes! Try Again'
            });
        } else {
            storage.add_file(req.files.uploaded_file, function(file){ 
                res.render('file/handler', {
                    title: 'dumploader',
                    tagline: 'File Uploaded!',
                    image: ((file.contentType.match(/^image.*/)) ? 'true' : 'false'),
                    file_id: file._id.toString(36),
                    file_name: file.filename,
                    host: req.headers.host,
                });
            });
        }
    });
};

/*
 * GET /info/:id/:filename?
 */
exports.info = function(req, res){
    var fileId = parseInt(req.params.id, 36);
    storage.gridfs.findOne({_id: fileId}, function (err, file) {
        if (!err && file) {
            file_size = (function(size) {
                if (size < 1024) return size + ' B';
                units = ['B', 'K', 'M', 'G', 'T', 'P'];
                while (size >= 1024) {
                    size = size / 1024;
                    units.shift();
                }
                return parseInt(size*100)/100 + ' ' + units.shift() + 'iB';
            })(file.length);
            res.render('file/info', {
                title: 'dumploader',
                tagline: 'Information on File',
                image: ((file.contentType.match(/^image.*/)) ? 'true' : 'false'),
                paste: ((file.contentType.match(/^text.*$|.*javascript$|.*php$/)) ? 'true' : 'false'),
                file: {
                    name: file.filename,
                    id: file._id.toString(36),
                    date: file.uploadDate,
                    md5: file.md5,
                    size: file_size,
                    length: file.length,
                    type: file.contentType,
                },
                host: req.headers.host,
            });
        }
    })
};

/*
 * GET /view/:id/:filename?
 */
exports.view = function(req, res){
    var file_id = parseInt(req.params.id, 36);
    storage.get_file(file_id, function(file) {
        var stream = file.readStream()
        res.setHeader("Content-Type", file.contentType);
        stream.pipe(res)
    });
};

/*
 * GET /show_all
 */
exports.list = function(req, res){
    var limit = req.params.limit;
    
    file_list = storage.gridfs.find({}, {_id: 1, filename: 1, uploadDate: 1, length: 1}).sort({uploadDate: -1}).limit(limit);
    file_list.toArray(function(err, value){
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
            this.push({file_id: element._id.toString(36), file_name: element.filename, file_date: element.uploadDate, file_size: file_size});
        }, file_list);
        res.render('file/list', {
            title: 'dumploader',
            tagline: 'Do You Recognise Any of These?',
            file_list: file_list,
            host: req.headers.host,
        });
    });
};