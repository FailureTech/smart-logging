const logger = require('./support/logger.cjs');
const { addTag, clearTags } = require('./support/core/tags-core.cjs');

module.exports = logger;
module.exports.addTag = addTag;
module.exports.clearTags = clearTags;
