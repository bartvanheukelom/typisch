import path from "path";

import {createResolveId} from "./typisch/src/rollup/@typisch/rollup";

const root = path.resolve(".")
const jsRoot = "build/tsc/main"
const dirs = [
    `${jsRoot}/src/main`,
    `${jsRoot}/src/common`,
]
const absDirs = [
    `${jsRoot}/typisch/src/core`,
    `${jsRoot}/typisch/src/electron`,
    `${jsRoot}/typisch/src/earthapp`,
]

const forbiddenModules = [
    // "electron",
]

export default {
    input: `${jsRoot}/src/main/main.js`,
    output: {
        dir: 'build/rollup/main',
        format: 'cjs'
    },
    context: "global",
    plugins: [
        {
            resolveId: createResolveId(root, jsRoot, dirs, absDirs, forbiddenModules),
            // transform: (code, id) => {
            //     return `
            //         console.log("[BEGIN " + ${JSON.stringify(id)} + "]");
            //
            //         ${code}
            //
            //         console.log("[END " + ${JSON.stringify(id)} + "]");
            //     `
            // },
        },
        // nodeResolve({
        //     preferBuiltins: false,
        //     resolveOnly: [],
        // }),
    ]
};
