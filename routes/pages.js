/*
 * GET /about
 */
exports.about = function(req, res){
    res.render('pages', {
        title: 'dumploader',
        tagline: "What's With This Thing?",
    })
};