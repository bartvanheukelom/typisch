import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import path from "path";

import { createResolveId } from "./typisch/src/rollup/@typisch/rollup";

const root = path.resolve(".")
const jsRoot = "build/tsc/renderer"
const dirs = [
    `${jsRoot}/src/renderer`,
    `${jsRoot}/src/common`,
]
const absDirs = [
    `${jsRoot}/typisch/src/core`,
    `${jsRoot}/typisch/src/electron`,
    `${jsRoot}/typisch/src/earthapp`,
]

const forbiddenModules = [
    "fs",
    // "path",
    "electron",
]

export default {
    input: `${jsRoot}/src/renderer/index.js`,
    output: {
        dir: 'build/rollup/renderer',
        format: 'es'
    },
    context: "window",
    plugins: [
        { resolveId(importee, importer) {
            if (importee.startsWith("@elastic/eui/src/")) {
                return this.resolve(importee.replace("@elastic/eui/src/", "@elastic/eui/es/"), importer)
            } else {
                return null
            }
        } },
        { resolveId: createResolveId(root, jsRoot, dirs, absDirs, forbiddenModules) },
        nodeResolve(),
        commonjs({}),
        json(),
    ]
};
