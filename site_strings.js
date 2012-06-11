exports.site = {
    title: "Dumploader",
    tagline: function(){
        s = [
            "Standard quality file hosting web application."
          , "Keeping the file hosting service market saturated."
          , "File hosting big enough to fit your mum."
          , "Where DMCA stands for Damn Media Corporations Associations."
          , "Just throw it on the pile."
          , "Powered by a roaring V8 engine."
          , "UPLOAD ALL THE THINGS!"
          , "Probably not good HCI"
          , "Blind people might not enjoy this"
          , "Oh yeah, I like it when you put it in me."
        ];
        return s[Math.floor(Math.random()*s.length)];
    },
    site_url: 'http://home.master5o1.com:3000'
}

exports.current_user = function(req) {
    if (typeof req.user != 'undefined') return req.user;
    return {};
}

// These aren't being used yet, but I'm planning it eventually.
exports.permissions = function(user) {
    var perms = {
        anonymous: {
            upload_max_file_size: 10*1024*1024,
            upload_content_types: [ /^[text|image]\/.+$/ ],
            upload_expiration: 60*60*24,
        },
        free: {
            upload_max_file_size: 100*1024*1024,
            upload_content_types: [ '/^.+$/' ],
            upload_expiration: 60*60*24*7,
        },
        premium: {
            upload_max_file_size: 1024*1024*1024,
            upload_content_types: [ '/^.+$/' ],
            upload_expiration: null,
        }
    };
    return perms[user.user_type];
}