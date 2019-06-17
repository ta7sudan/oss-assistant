"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("./lib/utils/safe-promise");
const yargs_1 = tslib_1.__importDefault(require("yargs"));
const yargonaut_1 = tslib_1.__importDefault(require("yargonaut"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const package_json_1 = require("../package.json");
const error_handler_1 = require("./lib/utils/error-handler");
const utils_1 = require("./lib/utils");
const authorName = typeof package_json_1.author === 'string' ? package_json_1.author : package_json_1.author.name;
process.addListener('SIGHUP', error_handler_1.handleSignal);
process.addListener('SIGQUIT', error_handler_1.handleSignal);
process.addListener('SIGINT', error_handler_1.handleSignal);
process.addListener('SIGTERM', error_handler_1.handleSignal);
process.addListener('uncaughtException', error_handler_1.handleError);
(async () => {
    const cmdName = utils_1.getCmds()[0], logo = await utils_1.getFiglet(cmdName);
    yargs_1.default.logo = logo;
    yargonaut_1.default
        .helpStyle('blue.underline')
        .style('red.bold', 'required')
        .style('magenta', ['boolean', 'string']);
    yargs_1.default
        .scriptName(cmdName)
        .commandDir('./commands')
        .recommendCommands()
        .completion('completion', 'get completion script')
        .alias('h', 'help')
        .alias('v', 'version')
        .example(`${cmdName} todo`, 'TODO')
        .usage(`${chalk_1.default.yellowBright(logo)}\n\n${chalk_1.default.blue.underline('Usage:')}\n  `
        + `${cmdName} <command> [options]`)
        .version(package_json_1.version)
        .epilog(`By ${authorName}`)
        .help()
        // 尽量不要用async函数, 不过这里用用也没事
        // MMP第三方的types这里类型少一个参数
        // tslint:disable-next-line
        .fail((async (msg, err, yargs) => {
        // 这个坑爹东西会捕获掉所有同步异常, 子命令的fail还会向上一级命令的fail冒泡
        if (err) {
            await error_handler_1.handleError(err);
        }
        else {
            // 处理子命令不带参数
            yargs.showHelp();
        }
    }));
    const argv = yargs_1.default.argv;
    // 没有参数或子命令就显示help
    if (!argv._.length) {
        yargs_1.default.showHelp();
    }
})();
//# sourceMappingURL=index.js.map