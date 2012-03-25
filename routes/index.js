/*
 * I find that the way the router works is that it only really sees this file by default.
 */
exports.file = require('./file_upload');
exports.link = require('./link_shortener');
exports.paste = require('./paste');
exports.pages = require('./pages');