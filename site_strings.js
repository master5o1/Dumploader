exports.site = {
    title: "Dumploader",
    tagline: function(){
        s = [
            "Standard quality file hosting web application."
          , "Keeping the file hosting service market saturated."
          , "File hosting big enough to fit your mum."
          //, "Where DMCA stands for Damn Media Corporations Associations."
          , "Just throw it on the pile."
          , "Powered by a roaring V8 engine."
          , "UPLOAD ALL THE THINGS!"
          , "Probably not good HCI"
          , "Blind people might not enjoy this"
        ];
        return s[Math.floor(Math.random()*s.length)];
    }
}