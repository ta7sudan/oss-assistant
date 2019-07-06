"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../lib/utils");
const list_1 = require("../lib/list");
const ls = {
    command: 'ls [options] <remotePath>',
    describe: 'list remote files or directories',
    builder(yargs) {
        return yargs
            .option('c', {
            alias: 'config',
            describe: 'specify configuration file, default is .pockrc.js, .pockrc.json, .pockrc.yml, .pockrc.yaml',
            string: true
        })
            .option('l', {
            alias: 'longFormat',
            describe: 'use a long listing format, default is false',
            boolean: true,
            default: false
        })
            .option('R', {
            alias: 'recursive',
            describe: 'list subdirectories recursively',
            boolean: true,
            default: false
        })
            .option('P', {
            alias: 'provider',
            describe: 'specify a service provider, such as "aws", "ali", "tencent"',
            string: true
        })
            .example(`${utils_1.getCmds()[0]} ls -P ali /`, 'list root directory recursively')
            .example(`${utils_1.getCmds()[0]} ls -P ali -l test.js`, 'list the detail of test.js');
        // .check(({ c }: Arguments<UploadArgv>, { config }: UploadAlias): boolean => {
        // 	console.log(c);
        // 	console.log(config);
        // 	return true
        // });
    },
    async handler(argv) {
        const { config, remotePath, longFormat, provider, recursive } = argv;
        const options = await utils_1.getOSSConfiguration(config, argv);
        const commandOptions = {
            longFormat: longFormat || options.longFormat,
            provider: provider || options.provider,
            recursive: recursive || options.recursive,
            remotePath: remotePath || options.remotePath || '/'
        };
        await list_1.list(commandOptions, options.ossOptions);
    }
};
// 这里必须用node的方式导出
module.exports = ls;
//# sourceMappingURL=ls.js.map