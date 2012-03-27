var fs = require("fs");
var Mongolian = require("mongolian");
var server = new Mongolian;
var db = server.db("dumploader");
var gridfs = db.gridfs();
var thumbs = db.gridfs('thumbs');

var im = require('imagemagick');

/*
TO DO:
Add file view counts.
This includes thumbnail counts.
Add a referer + incriment count: file.referers[referer]+=1;
View total view count: var view_count = 0; file.referers.forEach(function(element){ this += element }, view_count);
Etc.
db.collection('fs.view').insert({
    'referers': { },
    'thumb_referers': { },
});

Change the links views to the same way as this.
*/

exports.thumbs = thumbs;
exports.gridfs = gridfs;
exports.db = db;

exports.add_file = function(uploaded_file, callback) {
    db.collection('fs.files').count(function(err, value){
        var file_id = (new Date()).getTime();
        var file = gridfs.create({
            _id: file_id, // May not be Atomic but it works, I guess.
            filename: uploaded_file.name,
            contentType: uploaded_file.type,
        })
        if (uploaded_file.type.match(/^image\/.*/)) {
            var thumb = thumbs.create({
                _id: file_id,
                filename: uploaded_file.name,
                contentType: uploaded_file.type,
            });
            im.resize({
                srcPath: uploaded_file.path,
                dstPath: uploaded_file.path + '-thumb',
                width:   150
            }, function(err, stdout, stderr){
                if (err) throw err
                var thumb_stream = thumb.writeStream();
                fs.createReadStream(uploaded_file.path + '-thumb').pipe(thumb_stream);
            });
        }
        var stream = file.writeStream()
        fs.createReadStream(uploaded_file.path).pipe(stream)
        callback(file);
    });
}

exports.get_file = function(file_id, callback) {
    gridfs.findOne({_id: file_id}, function (err, file) {
        if (!err && file) {
            callback(file);
        }
    })
}

exports.get_thumb = function(file_id, callback) {
    thumbs.findOne({_id: file_id}, function (err, file) {
        if (!err && file) {
                callback(file);
        }
    })
}

exports.add_paste = function(paste, callback) {
    db.collection('fs.files').count(function(err, value){
        var file = gridfs.create({
            _id: (new Date()).getTime(), // May not be Atomic but it works, I guess.
            filename: paste.name + '.txt',
            contentType: 'text/plain',
        })
        var stream = file.writeStream()
        fs.writeFile("/tmp/paste-" + file._id.toString(36), paste.text, function(err) {
            if (err) throw err;
            fs.createReadStream("/tmp/paste-" + file._id.toString(36)).pipe(stream);
            fs.unlink("/tmp/paste-" + file._id.toString(36));
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