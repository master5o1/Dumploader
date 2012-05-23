var fs = require("fs");
var Mongolian = require("mongolian");
var server = new Mongolian;
var db = server.db("dumploader");
var gridfs = db.gridfs();
var thumbs = db.gridfs('thumbs');

var im = require('imagemagick');

exports.thumbs = thumbs;
exports.gridfs = gridfs;
exports.db = db;

exports.add_file = function(uploaded_file, callback) {
    db.collection('fs.files').count(function(err, value){
        var file = gridfs.create({
            filename: uploaded_file.name,
            contentType: uploaded_file.type,
            metadata: {
                views: 0,
                author: uploaded_file.author,
            }
        })
        file.save()
        if (uploaded_file.type.match(/^image\/[^svg|gif].*/)) {
            var thumb = thumbs.create({
                _id: new Mongolian.ObjectId(file._id.bytes),
                filename: uploaded_file.name,
                contentType: 'image/png',
            });
            im.resize({
                srcPath: uploaded_file.path,
                dstPath: uploaded_file.path + '-thumb',
                format: 'png',
                width:   150
            }, function(err, stdout, stderr){
                if (err) throw err
                var thumb_stream = thumb.writeStream();
                fs.createReadStream(uploaded_file.path + '-thumb').pipe(thumb_stream);
            });
            thumb.save();
        } else if (uploaded_file.type.match(/^image\/gif/)) {
            var thumb = thumbs.create({
                _id: new Mongolian.ObjectId(file._id.bytes),
                filename: uploaded_file.name,
                contentType: 'image/gif',
            });
            im.convert([uploaded_file.path, '-coalesce', uploaded_file.path + '-coalesce'], function(err, metadata){
                if (err) throw err
                im.resize({
                    srcPath: uploaded_file.path + '-coalesce',
                    dstPath: uploaded_file.path + '-thumb',
                    format: 'gif',
                    width:   150
                }, function(err, stdout, stderr){
                    if (err) throw err
                    var thumb_stream = thumb.writeStream();
                    fs.createReadStream(uploaded_file.path + '-thumb').pipe(thumb_stream);
                });
            })
            thumb.save();
        } else if (uploaded_file.type.match(/^image\/svg.*/)) {
            var thumb = thumbs.create({
                _id: new Mongolian.ObjectId(file._id.bytes),
                filename: uploaded_file.name,
                contentType: uploaded_file.type,
            });
            var thumb_stream = thumb.writeStream();
            fs.createReadStream(uploaded_file.path).pipe(thumb_stream);
            thumb.save();
        }
        var stream = file.writeStream()
        fs.createReadStream(uploaded_file.path).pipe(stream)
        file.save();
        callback(file);
    });
}

exports.get_file = function(id_buffer, callback) {
    gridfs.findOne({_id: new Mongolian.ObjectId(id_buffer)}, function (err, file) {
        if (!err && file) {
            callback(file);
        } else {
            callback(null);
        }
    })
}

exports.get_thumb = function(id_buffer, callback) {
    thumbs.findOne({_id: new Mongolian.ObjectId(id_buffer) }, function (err, file) {
        if (!err && file) {
            callback(file);
        } else {
            callback(null);
        }
    })
}

exports.add_paste = function(paste, callback) {
    db.collection('fs.files').count(function(err, value){
        var file = gridfs.create({
            filename: paste.name,
            contentType: paste.contentType,
            metadata: {
                views: 0,
                author: paste.author,
            }
        })
        file.save();
        var stream = file.writeStream()
        fs.writeFile("/tmp/paste-" + file._id.bytes.toString('base64').replace('/','-'), paste.text, function(err) {
            if (err) throw err;
            fs.createReadStream("/tmp/paste-" + file._id.bytes.toString('base64').replace('/','-')).pipe(stream);
            fs.unlink("/tmp/paste-" + file._id.bytes.toString('base64').replace('/','-'));
            file.save()
            callback(file);
        })
    });
}

exports.add_link = function(link_url, callback) {
    var links = db.collection('links');
    links.count(function(error, value) {
        link_id = (1 + value); // Not Atomic, I know.  But, it starts short :)
        link = {
            link_id: link_id,
            link_url: link_url,
            created: new Date,
            hits: 0,
        }
        links.insert(link);
        callback(link);
    });
}

exports.get_link = function(link_id, redirect, callback) {
    var links = db.collection('links');
    if (redirect) {
        links.findAndModify( {query: {link_id:link_id}, update : {"$inc":{"hits":1}}, 'new': true}, function (err, link) {
            link = { link_id: link.link_id, link_url: link.link_url, created: link.created };
            callback(link);
        });
    } else {
        links.findOne({ link_id: link_id }, function(err, link) {
            link = { link_id: link.link_id, link_url: link.link_url, created: link.created, hits: link.hits };
            callback(link);
        });
    }
}