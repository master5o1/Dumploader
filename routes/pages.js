var site = require('../site_strings').site;

var authorised_pages = {
    "about": {template: "about", title: "About Dumploader"},
    "404": {template: "errors/404", title: "Can't find it, bro."}
};

/*
 * GET /page/:name
 */
exports.run = function(req, res){
    var pages = function(r) {
        if (r in authorised_pages) {
            return authorised_pages[r];
        } else {
            return authorised_pages['404'];
        }
    };
    res.render('pages/' + pages(req.params.name).template, {
        site: site,
        tagline: pages(req.params.name).title,
    })
};

/*
 * GET /page
 */
exports.index = function(req, res){
    var pages = [];
    for (p in authorised_pages) {
        p1 = authorised_pages[p];
        p1.url = p;
        pages.unshift(p1);
    }
    res.render('pages/index', {
     site: site,
     tagline: 'List of pages',
     pages: pages
    });
};