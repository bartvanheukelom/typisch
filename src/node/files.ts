import {readProcessOut} from "./processes";

import child_process from "child_process";



/**
 * Determine the mime-type of the given file using the {@link https://linux.die.net/man/1/file Linux `file` command}.
 */
export async function getMimeWithLinuxFileCommand(
    filePath: string,
): Promise<string | null> {

    const process = child_process.spawn(
        "file",
        [
            "--brief", // don't prefix with file path
            "--mime-type",
            filePath,
        ],
        {
            stdio: ["ignore", "pipe", "inherit"]
        }
    )

    const type = (await readProcessOut("file", process)).trim()
    return type == "application/octet-stream" ? null : type

}
