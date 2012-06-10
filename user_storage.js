var Mongolian = require("mongolian");
var crypto = require('crypto');

var server = new Mongolian;
var db = server.db("dumploader");
var users = db.collection("users");

function User(user) {
    this._id = user._id,
    this.provider = user.provider;
    this.id = user.id;
    this.username = user.username;
    this.password = user.password;
    this.displayName = user.displayName;
    this.name = user.name;
    this.emails = user.emails;
    this.description = user.description;
}
var UserValidPassword = function(password) {
    if (!this.password) return false; // password not set yet, can't login without one set.
    if (this.password == crypto.createHash('sha1').update(this.provider + password + this.id).digest('base64')) {
        return true;
    }
    return false;
}
    
exports.user = {
    changeUserData: function(data, the_user, callback) {
        users.findOne({username: data.username}, function(err, user) {
            if (user) {
                var update = {};
                if (typeof data.new_username != 'undefined') { update.username = data.new_username; }
                if (typeof data.new_displayName != 'undefined') { update.displayName = data.new_displayName; }
                if (typeof data.new_description != 'undefined') { update.description = data.new_description; }
                users.findOne({_id: the_user._id}, function(err, updated_user) {
                    if (typeof update.username != 'undefined') { updated_user.username = update.username; }
                    if (typeof update.displayName != 'undefined') { updated_user.displayName = update.displayName; }
                    if (typeof update.description != 'undefined') { updated_user.description = update.description; }
                    users.save(updated_user);
                    callback(true, updated_user);
                });
            } else {
                callback(false, the_user);
            }
        });
    },
    findOne: function(searchObj, callback) {
        users.findOne(searchObj, function(err, user) {
            if (user) {
                var current_user = new User(user);
                current_user.validPassword = UserValidPassword;
                callback(err, current_user);
            } else {
                callback(err, null);
            }
        })
    },
    findOrCreate: function(obj, callback) {
        var search = obj.search; // { provider: 'openId', id: identifier }
        var profile = obj.profile;
        users.findOne(search, function(err, user) {
            if (user) {
                user.name = profile.name;
                user.emails = profile.emails;
                users.save(user);
                var current_user = new User(user);
                current_user.validPassword = UserValidPassword;
                callback(err, current_user);
            } else {
                var new_user = new User(profile);
                new_user.provider = search.provider;
                new_user.id = search.id;
                new_user.username = new_user.emails[0].value;//.split('@')[0];
                new_user.password = null;
                new_user.description = "";
                users.insert(new_user);
                users.findOne(search, function(error, found) {
                    if (found) {
                        var current_user = new User(found);
                        current_user.validPassword = UserValidPassword;
                        callback(err, current_user);
                    } else {
                        callback(error, null);
                    }
                });
            }
        });
    }
}
