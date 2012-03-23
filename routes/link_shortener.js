var storage = require('../storage');

/*
 * GET /link
 */

exports.form = function(req, res){
    res.render('url/form', {
        title: 'dumploader',
        tagline: "Sometimes it's just a little too big.",
    })
};

/*
 * POST /link
 */

exports.handler = function(req, res){
    storage.add_link(req.body.link_url, function(link){
        res.redirect('/link/' + link.link_id.toString(36) + '/info');
    });
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