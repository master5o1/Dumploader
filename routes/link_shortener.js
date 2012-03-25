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
        tagline: "Sometimes it's just a little too big.",
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
    storage.get_link(parseInt(req.params.id, 36), function(link) {
        link.link_id = link.link_id.toString(36);
        res.render('url/info', {
            title: 'dumploader',
            tagline: "Short link information.",
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
    storage.get_link(parseInt(req.params.id, 36), function(link) {
        res.redirect(link.link_url);
    });
};

/*
 * GET /list/links/:limit?
 */
exports.list = function(req, res){
    var limit = req.params.limit;
    
    link_list = storage.db.collection('links').find({}, {link_id: 1, link_url: 1, created: 1}).sort({_id: -1}).limit(limit);
    link_list.toArray(function(err, value){
        var link_list = [];
        value.forEach(function(element){
            this.push({link_id: element.link_id.toString(36), link_url: element.link_url, created: element.created});
        }, link_list);
        res.render('url/list', {
            title: 'dumploader',
            tagline: "Hope these aren't rotten",
            link_list: link_list,
        });
    });
};
