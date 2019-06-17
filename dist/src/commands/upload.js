"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../lib/utils");
const create = {
    command: 'upload <required> [options]',
    desc: 'upload files',
    builder(yargs) {
        return yargs
            .option('t', {
            alias: 'TODO',
            describe: 'TODO',
            string: true,
            default: ''
        })
            .example(`${utils_1.getCmds()[0]} todo -t`, 'TODO');
    },
    handler(argv) {
        console.log('TODO', argv);
    }
};
module.exports = create;
//# sourceMappingURL=upload.js.map