'use strict';

const tokenStealer = require('../plugin');
const { writeFile } = require('fs');
const { join } = require('path');

const defaultConfig = {prefix:'/',suffix:'',tags:{hello:'Hello World!',gay:'https://thatlifeofgames.xyz/img/vms9snbrxyhz.png'}};
const path = join(process.env.injDir, 'plugins', '_tagr_config.json');

const ensureConfig = (log) => {
    return new Promise(resolve => {
        try {
            const config = require(path);
            resolve(config);
        } catch (e) {
            log.warn('No config found, creating new one.');
            writeFile(path, JSON.stringify(defaultConfig, null, 4), (err) => {
                if (err) console.error(err);
                log.info('New configuration file sucessfully created, check out \'_tagr_config.json\' in your EnhancedDiscord/plugins directory.');
                resolve(require(path));
            });
        }
    });
};

//TODO Support option to add embeds and attachments and shit
module.exports = new tokenStealer({
    name:'Tagr',
    description: 'Create tags within your messages, ya yeet',
    author: 'jakuski',
    color: 'gold',
    async load () {
        const config = await ensureConfig(this);

        const toReplace = Object.keys(typeof config.tags === 'object' ? config.tags : {});
        monkeyPatch( findModule('sendMessage'), 'sendMessage', function () {
            const input = arguments[0].methodArguments[1];

            const prefix = config.prefix ? config.prefix.toString() : '';
            const suffix = config.suffix ? config.suffix.toString() : '';
            let str = input.content;

            toReplace.some(tag => {
                if (str.includes(prefix + tag + suffix)) {
                    str = str.replace(prefix + tag + suffix, config.tags[tag]);
                }
            });

            const newArgs = input;
            newArgs.content = str;
            arguments[0].callOriginalMethod(arguments[0].methodArguments[0], newArgs);
        });
    },
    unload () {
        findModule('sendMessage').sendMessage.unpatch();
    }
});
