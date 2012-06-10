var site = require('../site_strings');

var authorised_pages = {
     "about": {template: "about", title: "About Dumploader"}
   , "404": {template: "errors/404", title: "Can't find it, bro."}
   , "privacy" : {template: "privacy", title: "Privacy Policy"}
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
        site: site.site,
        current_user: site.current_user(req),
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
        site: site.site,
        current_user: site.current_user(req),
        tagline: 'List of pages',
        pages: pages
    });
};