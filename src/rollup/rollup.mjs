import fs from "fs";

export function createResolveId(
    root,
    jsRoot,
    dirs,
    absDirs,
    forbiddenModules,
    packDirs = [],
) {
    return function (importee, importer, options) {
        // if (importee.indexOf("typisch") !== -1) {
            // console.log(`resolve import ${importee} by ${importer}`);
        // }
        if (forbiddenModules && forbiddenModules.indexOf(importee) !== -1) {
            throw new Error(`Trying to import forbidden module ${importee} in renderer, by ${importer}`)
        }
        let res = null
        if (importee) {
            if (importee[0] == "/") {
                if (!importee.startsWith(root)) {

                    for (const d of dirs) {
                        const f = `${d}/${importee.substring(1)}.js`;
                        if (fs.existsSync(f)) {
                            res = f;
                            break;
                        }
                    }
                }
            } else {
                for (const [pack, dir] of packDirs) {
                    if (importee == pack || importee.startsWith(pack + "/")) {
                        const f = dir + importee.substring(pack.length);
                        // console.log(`pack resolution: ${importee} -> ${f}`);
                        return this.resolve(f, importer, options);
                    }
                    // if (importee.startsWith(pack + "/")) {
                    //     const f = `${dir}/${importee.substring(pack.length + 1)}.js`;
                    //     if (fs.existsSync(f)) {
                    //         res = f;
                    //         break;
                    //     }
                    // }
                }
                for (const d of absDirs) {
                    const f = `${d}/${importee}.js`;
                    if (fs.existsSync(f)) {
                        res = f;
                        break;
                    }
                }

                if (res === null) {
                    // TODO is this not default?
                    const f = `${importee}.js`;
                    if (fs.existsSync(f)) {
                        // console.log(`resolved to concrete file: ${f}`);
                        res = f;
                    }
                }
                if (res === null) {
                    // TODO is this not default?
                    const f = `${importee}/index.js`;
                    if (fs.existsSync(f)) {
                        // console.log(`resolved to concrete file: ${f}`);
                        res = f;
                    }
                }
            }
        }
        if (res != null) {
            // console.log(`resolveId: ${importer} import "${importee}" -> ${res}`)
        }
        return res
    }
}
