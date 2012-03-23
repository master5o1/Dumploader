/*
 * GET /
 * GET /about
 */

exports.run = function(req, res){
    res.render('about', {
        title: 'dumploader',
        tagline: "What's with this thing?",
    })
};