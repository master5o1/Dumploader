exports.file = {
    form: require('./file_upload').form
  , upload: require('./file_upload').upload
  , view: require('./file_upload').view
  , info: require('./file_upload').info
  , list: require('./file_upload').list
}

exports.link = {
    form: require('./link_shortener').form
  , handler: require('./link_shortener').handler
  , redirect: require('./link_shortener').redirect
  , info: require('./link_shortener').info
  , list: require('./link_shortener').list
}
exports.about = require('./about').run;