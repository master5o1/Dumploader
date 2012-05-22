var fs = require('fs');
var storage = require('../storage');
var site = require('../site_strings').site;
var url = require('url');

/*
 * GET /search/:skip?q=<string>
 * GET /search?q=<string>
 */
exports.find = function(req, res){
    var keywords = '';
    if (typeof req.query.q != 'undefined') {
        keywords = req.query.q;
    }
    keywords = keywords.split(' ');
    var results = [];
    var results_a = [];
    keywords.forEach(function(keyword, index, array) {
        if (keyword.charAt(keyword.length-1) == 's' || keyword.charAt(keyword.length-1) == 'S') {
            keyword = keyword.substring(0, keyword.length-1);
        }
        storage.db.collection('fs.files').find({ "filename": new RegExp(".*"+keyword+".*", 'i') }).sort({uploadDate: -1}).toArray(function(err, files) {
            if (files.length > 0) {
                results_a.push(files);
                files.forEach(function(r, i, a) {
                    if (this.indexOf(r) == -1) {
                        this.push(r);
                    }
                }, results);
                
            } else {
                results_a.push([]);
            }
            if (results_a.length == keywords.length) {
                var final_result = [];
                results.forEach(function(rs, is, as) {
                    if (as.indexOf(rs) != is) {
                        final_result.unshift(rs);
                    } else {
                        final_result.push(rs);
                    }
                }, final_result);
                var to_jade = [[],[]];
                final_result.forEach(function(fe, fi, fa) {
                    if (this[0].indexOf(fe.md5) == -1) {
                        this[0].push(fe.md5);
                        var file_size = (function(size) {
                            if (size < 1024) return size + ' B';
                            units = ['B', 'K', 'M', 'G', 'T', 'P'];
                            while (size >= 1024) {
                                size = size / 1024;
                                units.shift();
                            }
                            return parseInt(size*100)/100 + ' ' + units.shift() + 'iB';
                        })(fe.length);
                        var file_date = (function(uploadDate){
                            var element = {uploadDate: uploadDate};
                            var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                            var date = element.uploadDate.getUTCDate() + ' ' + months[element.uploadDate.getUTCMonth()] + ' '
                                    + element.uploadDate.getUTCFullYear() + ' '
                                    + ((element.uploadDate.getUTCHours().toString().length == 1)?"0"+element.uploadDate.getUTCHours():element.uploadDate.getUTCHours()) + ':'
                                    + ((element.uploadDate.getUTCMinutes().toString().length == 1)?"0"+element.uploadDate.getUTCMinutes():element.uploadDate.getUTCMinutes()) + ':'
                                    + ((element.uploadDate.getUTCSeconds().toString().length == 1)?"0"+element.uploadDate.getUTCSeconds():element.uploadDate.getUTCSeconds());
                            return date;
                        })(fe.uploadDate);
                        this[1].push({
                            file_id: fe._id.bytes.toString('base64').replace('/','-'),
                            file_name: fe.filename,
                            file_size: file_size,
                            file_views: fe.metadata.views,
                            file_date: file_date,
                            uploadDate: fe.uploadDate
                        });
                    }
                }, to_jade);
                var limit = 25;
                var skip = req.params.skip;
                if (typeof skip == 'undefined' || skip == undefined || skip <= 0) skip = 0;
                var file_list = to_jade[1].splice(skip, limit);
                var current_count = file_list.length;
                if (current_count > 0) {
                res.render('search/list', {
                    site: site,
                    tagline: 'Search Results',
                    file_list: file_list,
                    host: req.headers.host,
                    show_next: ((current_count == limit)? true : false),
                    next_skip: (limit + parseInt(skip)),
                    limit: limit,
                    query: keywords.join(' ')
                });
                } else {
                    res.render('search/empty', {
                        site: site,
                        tagline: 'Search Results',
                        host: req.headers.host,
                        query: keywords.join(' ')
                    });                    
                }
            }
        });
    }, results);
};
