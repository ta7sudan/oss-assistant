"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const figures_1 = tslib_1.__importDefault(require("figures"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
exports.error = (msg) => console.error(chalk_1.default.red(`${figures_1.default.cross} ${msg}`));
exports.success = (msg) => console.log(`${chalk_1.default.green(figures_1.default.tick)} ${msg}`);
exports.warn = (msg) => console.warn(`${chalk_1.default.red(figures_1.default.warning)} ${chalk_1.default.yellow(msg)}`);
//# sourceMappingURL=logger.js.map