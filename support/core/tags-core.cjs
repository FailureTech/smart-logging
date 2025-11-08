const context = require('./context-core.cjs');

const validateMetadata = (metadata = {}) => {
    if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
        throw new TypeError('addTag expects a plain object with key/value pairs');
    }
    const invalidKey = Object.keys(metadata).find((key) => typeof key !== 'string' || key.trim() === '');
    if (invalidKey) {
        throw new TypeError('addTag expects object keys to be non-empty strings');
    }
    const invalidValueKey = Object.entries(metadata).find(
        ([, value]) => typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean' && value !== null,
    );
    if (invalidValueKey) {
        throw new TypeError('addTag expects values to be strings, numbers, booleans, or null');
    }
};

const normalizeMetadata = (metadata) =>
    Object.fromEntries(Object.entries(metadata).map(([key, value]) => [key, value === null ? null : String(value)]));

const addTag = (metadata = {}) => {
    validateMetadata(metadata);
    const normalizedMetadata = normalizeMetadata(metadata);
    const current = context.getStore() || {};
    context.enterWith({ ...current, ...normalizedMetadata });
};

const clearTags = () => {
    context.enterWith({});
};

module.exports = {
    addTag,
    clearTags,
};
