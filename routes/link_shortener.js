var storage = require('../storage');
var url = require('url');

/*
 * GET /link
 */
exports.form = function(req, res){
    var req_url = url.parse(req.url, true);
    show_error = 'false';
    error = '';
    if (typeof req_url.query.error != undefined) {
        show_error = 'true';
        error = req_url.query.error;
    }
    res.render('url/form', {
        title: 'dumploader',
        tagline: "Sometimes It's Just a Little Too Big",
        show_error: show_error,
        error: error,
    })
};

/*
 * POST /link
 */
exports.handler = function(req, res){
    var tested_url = (function (s) {
        var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
        return regexp.test(s);
    })(req.body.link_url);
    if (tested_url) {
        storage.add_link(req.body.link_url, function(link){
            res.redirect('/link/' + link.link_id.toString(36) + '/info');
        });
    } else {
        res.redirect('/link?error=' + encodeURI('Malformed URL'));
    }
};

/*
 * GET /link/:id
 */
exports.info = function(req, res){
    if (req.params.id == 0) { res.redirect('/link'); }
    storage.get_link(parseInt(req.params.id, 36), false, function(link) {
        link.link_id = link.link_id.toString(36);
        link.hits = link.hits || 0;
        res.render('url/info', {
            title: 'dumploader',
            tagline: "Short Link Information",
            link: link,
            host: req.headers.host,
        })
    });
};

/*
 * GET /link/:id
 */
exports.redirect = function(req, res){
    if (req.params.id == 0) { res.redirect('/link'); }
    storage.get_link(parseInt(req.params.id, 36), true, function(link) {
        res.redirect(link.link_url);
    });
};

/*
 * GET /list/links/:limit?
 */
exports.list = function(req, res){
    var limit = req.params.limit;
    
    link_list = storage.db.collection('links').find({}, {link_id: 1, link_url: 1, created: 1, hits: 1}).sort({_id: -1}).limit(limit);
    link_list.toArray(function(err, value){
        var link_list = [];
        value.forEach(function(element){
            element.created = (function(uploadDate){
            var element = {uploadDate: uploadDate};
            var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            var date = element.uploadDate.getUTCDate() + ' ' + months[element.uploadDate.getUTCMonth()-1] + ' '
                    + element.uploadDate.getUTCFullYear() + ' '
                    + ((element.uploadDate.getUTCHours().toString().length == 1)?"0"+element.uploadDate.getUTCHours():element.uploadDate.getUTCHours()) + ':'
                    + ((element.uploadDate.getUTCMinutes().toString().length == 1)?"0"+element.uploadDate.getUTCMinutes():element.uploadDate.getUTCMinutes()) + ':'
                    + ((element.uploadDate.getUTCSeconds().toString().length == 1)?"0"+element.uploadDate.getUTCSeconds():element.uploadDate.getUTCSeconds());
            return date;
            })(element.created);
            this.push({link_id: element.link_id.toString(36), link_url: element.link_url, created: element.created, hits: element.hits || 0});
        }, link_list);
        res.render('url/list', {
            title: 'dumploader',
            tagline: "Hope These Aren't Rotten",
            link_list: link_list,
        });
    });
};
