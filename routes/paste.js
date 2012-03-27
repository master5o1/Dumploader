var fs = require('fs');
var storage = require('../storage');
var url = require('url');
var site = require('../site_strings').site;
/*
 * GET /paste
 */
exports.form = function(req, res){
    var req_url = url.parse(req.url, true);
    show_error = 'false';
    error = '';
    if (typeof req_url.query.error != undefined) {
        show_error = 'true';
        error = req_url.query.error;
    }
    res.render('pastebin/form', {
        site: site,
        tagline: 'Paste It Here',
        show_error: show_error,
        error: error,
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
    var file_id = parseInt(req.params.id, 36);
    storage.get_file(file_id, function(file) {
        if ( file.contentType.match(/^text.*$|^.*javascript$|^.*php$/) ) {
            var stream = file.readStream()
            stream.on('data', function(data){
                var paste = data.toString();
                var lines = paste.replace(/\r/g,'').replace(/\n/g,'\r\n').split('\n');
                var lines_data = [];
                lines.forEach(function(element, index) {
                    this[index] = element.replace('\r','\r\n');
                }, lines_data);
                lines = lines_data;
                res.render('pastebin/view', {
                    site: site,
                    tagline: 'Lines Numbered For Your Viewing Pleasure',
                    file_id: req.params.id,
                    file_name: file.filename,
                    lines: lines,
                    paste_data: paste,
                })
            });
        } else {
            name_param = '';
            if (typeof req.params.name != undefined) {
                name_param = '/' + req.params.name;
            }
            res.redirect('/view/' + req.params.id + name_param);
        }
    });
};