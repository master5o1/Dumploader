exports.site = {
    title: "Dumploader",
    tagline: function(){
        s = [
            "Standard quality file hosting web application."
          , "Keeping the file hosting service market saturated."
          , "File hosting big enough to fit your mum."
          , "Just throw it on the pile."
        ];
        return s[Math.floor(Math.random()*s.length)];
    }
}
/*
 ((function(){
        return tagline[Math.floor(Math.random()*taglines.length)];
    })())
*/