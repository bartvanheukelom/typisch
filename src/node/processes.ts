import child_process from "child_process";

export async function run(command: string, args: string[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
        const process = child_process.spawn(
            command, args,
            {
                stdio: ["ignore", "inherit", "inherit"]
            }
        )
        process.on("close", async (code, signal) => {
            if (code == 0) {
                resolve()
            } else {
                console.log(`'${command}' closed with code ${code} by signal ${signal}`)
                reject(code)
            }
        })
    })
}
