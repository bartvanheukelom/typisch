import fs from "fs";

export function createResolveId(
    root,
    jsRoot,
    dirs,
    absDirs,
    forbiddenModules
) {
    return (importee, importer) => {
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
                for (const d of absDirs) {
                    const f = `${d}/${importee}.js`;
                    if (fs.existsSync(f)) {
                        res = f;
                        break;
                    }
                }
            }
        }
        if (res != null) {
            console.log(`resolveId: ${importer} import "${importee}" -> ${res}`)
        }
        return res
    }
}
