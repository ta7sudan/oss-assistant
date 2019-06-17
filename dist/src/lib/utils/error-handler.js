"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const ora_1 = tslib_1.__importDefault(require("ora"));
const index_1 = require("./index");
// 尽量不要用async函数来做最终的异常处理
async function handleSignal() {
    const spiner = ora_1.default('do clean up...\n').start();
    try {
        await index_1.cleaner.cleanup();
        spiner.succeed('Exiting without error.');
    }
    catch (e) {
        index_1.logger.error(`Clean up failed. Error message: ${e.message}`);
        console.error(chalk_1.default.red(e.stack));
        process.exit(1);
        return;
    }
    process.exit();
}
exports.handleSignal = handleSignal;
function isCustomError(e) {
    return !!e.msg;
}
// 尽量不要用async函数来做最终的异常处理
async function handleError(e) {
    if (isCustomError(e)) {
        index_1.logger.error(e.msg);
    }
    else {
        index_1.logger.error(e.message);
    }
    console.error(chalk_1.default.red(e.stack));
    const spiner = ora_1.default('do clean up...\n').start();
    try {
        await index_1.cleaner.cleanup();
        spiner.succeed('clean up done.');
    }
    catch (err) {
        index_1.logger.error(`Clean up failed. Error message: ${err.message}`);
        console.error(chalk_1.default.red(err.stack));
    }
    process.exit(1);
}
exports.handleError = handleError;
//# sourceMappingURL=error-handler.js.map