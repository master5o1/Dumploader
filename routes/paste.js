var fs = require('fs');
var storage = require('../storage');

/*
 * GET /paste
 */
exports.form = function(req, res){
    res.render('pastebin/form', {
        title: 'dumploader',
        tagline: 'paste it here.',
    })
};

/*
 * POST /paste
 */
exports.handler = function(req, res) {
    if (req.body.pasted_text.length == 0) {
        res.redirect('/paste?error=Try entering some text this time.')
    } else {
        var paste = {
            name: ((req.body.pasted_title != '') ? req.body.pasted_title : 'untitled'),
            text: req.body.pasted_text
        }
        storage.add_paste(paste, function(file){ 
            res.redirect('/info/' + file._id.toString(36))
        });
    }
};


/*
 * GET /paste/:id/:name?
 */
exports.view = function(req, res) {
    res.send("VIEW PASTEBIN? " + req.params.id + ' ' + parseInt(req.params.id, 36));
};