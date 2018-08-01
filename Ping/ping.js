const Plugin = require('../plugin');

const num = () => {
    return Math.random() * (999999999999999999 - 0) + 0;
}

module.exports = new Plugin({
    name: 'Ping',
    author: 'jakuski',
    description: 'ping pong',
    color: '#f04747',
    load: function() {
        monkeyPatch( findModule('getMentionCount'), 'getMentionCount', function() { return num(); });
    },
    unload: function() {
        findModule('getMentionCount').getMentionCount.unpatch();
    }
});
