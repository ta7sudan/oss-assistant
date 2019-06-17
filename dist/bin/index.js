#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const semver = tslib_1.__importStar(require("semver"));
const utils_1 = require("../src/lib/utils");
const package_json_1 = require("../package.json");
const { node: nodeVersion } = package_json_1.engines;
function checkNodeVersion(wanted, cliName) {
    const curNodeVersion = process.version;
    if (!semver.satisfies(curNodeVersion, wanted)) {
        utils_1.logger.error(`You are using Node ${curNodeVersion}, but this version of ${cliName} requires Node ${wanted}. Please upgrade your Node version.`);
        process.exit(1);
    }
}
checkNodeVersion(nodeVersion, utils_1.getCmds()[0]);
require('../src');
//# sourceMappingURL=index.js.map