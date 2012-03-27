var site = require('../site_strings').site;
/*
 * GET /about
 */
exports.about = function(req, res){
    res.render('pages', {
        site: site,
        tagline: "What's With This Thing?",
    })
};