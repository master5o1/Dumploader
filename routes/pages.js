/*
 * GET /about
 */
exports.about = function(req, res){
    res.render('about', {
        title: 'dumploader',
        tagline: "What's with this thing?",
    })
};