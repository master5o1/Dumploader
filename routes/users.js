var site = require('../site_strings');
var user_storage = require("../user_storage.js");

exports.profile = function(req, res){
    var username = req.params.username;
    if (username == 'anonymous') { res.redirect('/'); }
    user_storage.user.findOne({ username: username }, function (err, user) {
        if (user) {
            res.render('users/profile', {
                site: site.site,
                current_user: site.current_user(req),
                tagline: 'Profile: ' + user.displayName,
                displayed_user: user
            })
        } else {
            res.redirect('/');
        }
    });
};

exports.checkUserName = function(req, res) {
    if (typeof req.query.username == 'undefined' || req.query.username.match(/anonymous/i) || req.query.username == '' || req.query.username.length > 100) {
        res.send(JSON.stringify({ allowed: false, name: req.query.username }));
        return
    }
    if (req.query.username == req.params.username) {
        res.send(JSON.stringify({ allowed: true, name: req.query.username }));
        return
    }
    user_storage.user.findOne({username: req.query.username}, function(err, user) {
        if (!user) {
            result = { allowed: true, name: req.query.username }
        } else {
            result = { allowed: false, name: req.query.username }
        }
        res.send(JSON.stringify(result));
    });
};

exports.changeUserData = function(req, res) {
    var current_user = site.current_user(req);
    var data = JSON.parse(req.body.changed_data);
    if (data.username != current_user.username) {
        res.send(JSON.stringify({
            success: false,
            user: { displayName: null, username: null, description: null }
        }));
        return
    }
    user_storage.user.findOne({username: data.username}, function(err, the_user) {
        if (!the_user) {
            res.send(JSON.stringify({ success: false, user: { displayName: the_user.displayName, username: the_user.username, description: the_user.description } }));
        } else {
            user_storage.user.changeUserData(data, the_user, function(success, user) {
                var result = { success: false, user: { displayName: the_user.displayName, username: the_user.username, description: the_user.description } };
                if (success) {
                    result = { success: true, user: { displayName: the_user.displayName, username: the_user.username, description: the_user.description } }
                }
                res.send(JSON.stringify(result));
            });
        }
    });
};