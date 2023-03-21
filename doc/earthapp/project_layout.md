# Earth App Project Layout

## ./eslintrc.json

    {
        "env": {
            "browser": true,
            "es6": true,
            "node": true
        },
        "extends": [
            "eslint:recommended",
            "plugin:@typescript-eslint/eslint-recommended",
            "plugin:@typescript-eslint/recommended"
        ],
        "rules": {
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-extra-non-null-assertion": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/no-this-alias": "off",
            "no-empty": "off",
            "no-restricted-imports": ["error", { "patterns": [
                { "group": ["../typisch/*"], "message": "use '@typisch/...'" }
            ] }]
        },
        "parser": "@typescript-eslint/parser",
        "overrides": [{
            "files": "*.ts",
            "parserOptions": {
                "project": [
                    "src/main/tsconfig.json",
                    "src/renderer/tsconfig.json"
                ]
            }
        }],
        "ignorePatterns": [
            "/",
            "!/src",
            "!/typisch/src"
        ]
    }

## ./build.gradle.kts

    import kotlinx.serialization.json.*
    import kotlinx.serialization.json.Json.Default.decodeFromString

    buildscript {
        dependencies {
            "classpath"("org.jetbrains.kotlinx:kotlinx-serialization-json:1.4.1")
        }
        repositories {
            mavenCentral()
        }
    }
    
    val typischProjects = childProjects.getValue("typisch").childProjects.getValue("packs").childProjects
    val typischPacks = typischProjects.values.map { it.name }
    
    val moduleProjects = childProjects.getValue("modules").childProjects
    val mpMain = moduleProjects.getValue("main")
    val mpRenderer = moduleProjects.getValue("renderer")
    
    buildDir = file("build")
    
    val depLockFile = file("pnpm-lock.yaml")
    // describes the contents of node_modules and can be used for up-to-date checks instead of the node_modules dir itself
    val nodeModules = file("node_modules")
    val nodeModulesManifest = File(nodeModules, ".pnpm/lock.yaml")
    
    val src = file("src")
    val buildRenderer = File(buildDir, "renderer")
    val rootDir = projectDir
    
    
    fun ExecSpec.pnpmCommand(vararg cmd: String) {
        workingDir = projectDir
        commandLine("npx", "pnpm", *cmd)
    }
    
    val npmInstall = tasks.register("npmInstall") {
        
        inputs.property("version", 22110302)
        inputs.file("package.json")
        outputs.file(depLockFile) // also input
        outputs.file(nodeModulesManifest)
     
        doLast {
            
            // hardcore, causes a full reinstall even if only e.g. this build script changed a bit,
            // so disabled. enable if you want to force a full reinstall (or just delete node_modules).
    //		nodeModules.deleteRecursively()
    //		check(!nodeModules.exists())
            
            exec { pnpmCommand("install",
                "--shamefully-hoist"
            ) }
            
            exec {
                workingDir = projectDir
                // TODO this poisons PNPM's centrally stored version, do something about that
                commandLine("npx", "electron-rebuild")
            }
            
            typischPacks.forEach {
                val link = File(nodeModules, "@typisch/$it")
                val target = file("typisch/build/$it")
                link.parentFile.mkdirs()
                check(link.parentFile.isDirectory)
                exec {
                    commandLine("ln", "--symbolic", "--no-target-directory",
                        "--force", // because it may already exist from a previous install
                        target.relativeTo(link.parentFile), link)
                }
            }
        }
    }
    
    configure(typischProjects.values) {
        val tp = this
        
        val typischRoot = file("../..")
        val srcRoot = File(typischRoot, "src")
        
        tasks {
            
            val tsc by registering {
                dependsOn(npmInstall)
                
                val srcDir = File(srcRoot, tp.name)
                val configFile = File(srcDir, "tsconfig.json")
                
                val tsConfig = configFile.readText()
                    .let { decodeFromString(JsonObject.serializer(), it) }
                
                val interDeps = tsConfig.get("references")
                    ?.let { refs -> refs.jsonArray
                        .map { it.jsonObject.getValue("path").jsonPrimitive.content.removePrefix("../") }
                    }
                    ?: emptyList()
                logger.info("Inter-project dependencies for typisch pack ${tp.name}: $interDeps")
                interDeps.forEach {
                    dependsOn(typischProjects.getValue(it).tasks.named("tsc"))
                }
                
                inputs.file(nodeModulesManifest)
                inputs.file(configFile)
                inputs.file(File(srcRoot, "tsconfig-base.json"))
                inputs.file(File(typischRoot, "tsconfig-base.json"))
                inputs.dir(srcDir)
                
                outputs.dir(File(typischRoot, "build/${tp.name}"))
                
                val cmdLine = listOf(
                    "npx", "tsc",
                    "--project", configFile.absolutePath,
                    "--incremental",
                    // make CJS modules for Node - TODO cleaner solution
                    "--module", "commonjs",
                )
                inputs.property("cmdLine", cmdLine)
                
                // TODO https://github.com/microsoft/TypeScript/wiki/Performance#concurrent-type-checking
                doLast {
                    exec {
                        workingDir = typischRoot // TEMP because typisch/$pack dir doesn't exist
                        commandLine(cmdLine)
                    }
                }
            }
            
            val build by registering {
                dependsOn(tsc)
            }
            
        }
    }
    
    val srcRoot = file("src")
    
    configure(moduleProjects.values) {
        val mp = this
        
        val srcDir = File(srcRoot, mp.name)
        val configFile = File(srcDir, "tsconfig.json")
        
        val tsConfig = configFile.readText()
            .let { decodeFromString(JsonObject.serializer(), it) }
        
        val outDir = File(configFile.parentFile, tsConfig.getValue("compilerOptions").jsonObject.getValue("outDir").jsonPrimitive.content)
        
        tasks {
            
            val tsc by registering {
                dependsOn(npmInstall)
                
                val tpDeps = tsConfig.get("references")
                    ?.let { refs -> refs.jsonArray
                        .map { it.jsonObject.getValue("path").jsonPrimitive.content.removePrefix("../../typisch/src/") }
                    }
                    ?: emptyList()
                logger.info("Typisch pack dependencies for module ${mp.name}: $tpDeps")
                tpDeps.forEach {
                    val tp = typischProjects[it] ?: error("Typisch pack '$it' not found in ${typischProjects.keys}")
                    dependsOn(tp.tasks.named("tsc"))
                }
                
                inputs.file(nodeModulesManifest)
                inputs.file(configFile)
                inputs.dir(srcDir)
                
                logger.info("Output dir for module ${mp.name}: $outDir")
                outputs.dir(outDir)
                
                doLast {
                    exec {
                        workingDir = srcDir
                        commandLine("npx", "tsc",
                            "--project", configFile.absolutePath,
                            "--incremental",
                        )
                    }
                }
                
            }
            
            val build by registering {
                dependsOn(tsc)
            }
            
            if (mp.name == "renderer") {
                
                val buildBundle = File(rootProject.buildDir, "bundle/index.js")
                val buildSass = File(rootProject.buildDir, "sass")
                
                val bundle by registering(Exec::class) {
                    dependsOn(tsc)
                    
                    val configFile = file("esbuild.mjs")
                    val typischModules = file("typisch/node_modules")
                    
                    inputs.file(nodeModulesManifest)
                    inputs.file(configFile)
                    inputs.dir(outDir)
                    inputs.dir(rootProject.file("typisch/build"))
                    
                    outputs.file(buildBundle)
                    
                    doFirst {
                        if (typischModules.exists()) {
                            // TODO fix properly
                            error("Cannot safely bundle while '$typischModules' exists. Delete it.")
                        }
                        delete(buildBundle)
                    }
                    commandLine(
                        configFile.absolutePath,
                        "--indir", outDir.absolutePath,
                        "--outfile", buildBundle.absolutePath,
                    )
                    standardOutput = System.out
                    errorOutput = System.err
                }
                
                val sass by registering(Exec::class) {
                    dependsOn(npmInstall)
                    
                    val inputFile = file("index.scss")
                    val outputFile = File(buildSass, "index.css")
                    
                    inputs.file(nodeModulesManifest) // in case sass itself is updated
                    inputs.file(inputFile)
                    
                    outputs.file(outputFile)
                    
                    commandLine("npx", "sass", inputFile.absolutePath, outputFile.absolutePath)
    //				workingDir = rootProject.projectDir - doesn't matter, imports are resolved relative to the file they're in
                    standardOutput = System.out
                    errorOutput = System.err
                }
                
                val copy by registering(Copy::class) {
                    dependsOn(bundle, sass)
                    
                    doFirst {
                        // delete contents but not the dir, as a running webserver can trip on that
                        buildRenderer.listFiles()?.forEach { it.delete() }
                    }
                    
                    // TODO why do extra dirs main and renderer appear in result
                    from(
                        // dirs
                        rootProject.file("renderer"),
                        buildBundle.parentFile,
                        buildSass,
                        // files
    //					File(nodeModules, "cropperjs/dist/cropper.css"), - not used, example
                    )
                    into(buildRenderer)
                    
                    doLast {
                        File(buildRenderer, "build.json").writeText("""
                            { "time": "${java.time.Instant.now()}" }
                        """.trimIndent())
                    }
                }
                
                val copyNotify by registering(Exec::class) {
                    dependsOn(copy)
                    commandLine("notify-send", "${rootProject.name}: renderer copied")
                }
                
                build {
                    dependsOn(copy)
                }
            }
            
        }
        
    }
    
    
    
    tasks {
    
        val preNpmStartMain by registering {
            dependsOn(mpMain.tasks.named("build"))
        }
    
        val preNpmStart by registering {
            dependsOn(
                preNpmStartMain,
                mpRenderer.tasks.named("copy")
                //rdtExtract,
            )
        }
    
        val build by registering {
        }
        
    }
    
    afterEvaluate {
        tasks.named("build").configure {
            val parent = this
            typischProjects.values.forEach { child ->
                parent.dependsOn(child.tasks["build"])
            }
            moduleProjects.values.forEach { child ->
                parent.dependsOn(child.tasks["build"])
            }
        }
    }
    
    gradle.taskGraph.addTaskExecutionListener(object : TaskExecutionListener {
        override fun beforeExecute(task: Task) {}
        
        override fun afterExecute(task: Task, state: TaskState) {
            state.failure?.let { e ->
                exec {
                    commandLine("notify-send", "${task.name}: ERROR $e")
                }
            }
        }
        
    })

## ./gradle.properties

    org.gradle.caching=true
    org.gradle.parallel=true

## ./package.json
    
    {
      "name": "superapp",
      "productName": "SuperApp",
      "version": "1.2.3",
      "description": "Just Super",
      "main": "build/tsc/main/src/main/main.js",
      "scripts": {
        "start": "./gradlew preNpmStart && electron .",
        "startMain": "./gradlew preNpmStartMain && electron .",
        "lint": "eslint --ext .ts ."
      },
      "keywords": [],
      "author": {
        "name": "Bart van Heukelom",
        "email": "mail@bartvh.nl"
      },
      "license": "MIT",
      "devDependencies": {
        "@electron/rebuild": "^3.2.10",
        "@types/async": "^3.2.15",
        "@types/better-sqlite3": "^7.6.3",
        "@types/body-parser": "^1.19.0",
        "@types/express": "^4.17.14",
        "@types/fs-ext": "^2.0.0",
        "@types/lodash": "^4.14.186",
        "@types/node": "^18.8.5",
        "@types/react": "17.x",
        "@types/react-dom": "17.x",
        "@types/xml2js": "^0.4.8",
        "@types/yargs": "^17.0.13",
        "@typescript-eslint/eslint-plugin": "^5.40.0",
        "@typescript-eslint/parser": "^5.40.0",
        "electron": "^22.1.0",
        "esbuild": "^0.15.13",
        "eslint": "^8.25.0",
        "eslint-plugin-import": "^2.26.0",
        "npm-check-updates": "^16.3.11",
        "sass": "^1.55.0",
        "typescript": "^4.8.4",
        "yargs": "^17.6.2"
      },
      "dependencies": {
        "@babel/core": "^7.0.0",
        "@elastic/datemath": "^5.0.3",
        "@elastic/eui": "^74.0.1",
        "@emotion/cache": "11.x",
        "@emotion/css": "11.x",
        "@emotion/react": "11.x",
        "async": "^3.2.4",
        "async-mutex": "^0.4.0",
        "better-sqlite3": "^8.0.1",
        "body-parser": "^1.19.0",
        "csv": "^6.2.1",
        "csv-stringify": "^6.2.1",
        "electron-window-state": "^5.0.3",
        "express": "^4.18.2",
        "fs-ext": "^2.0.0",
        "lodash": "^4.17.21",
        "moment": "^2.29.4",
        "node-abi": "^3.5.0",
        "react": "17.x",
        "react-cropper": "^2.1.8",
        "react-dom": "17.x",
        "prop-types": "^15.7.2",
        "tslib": "^2.4.0",
        "xml2js": "^0.4.23",
        "yargs": "^17.5.1"
      }
    }

## ./settings.gradle.kts

    rootProject.name = "superapp"
    
    val typischPacks = listOf("core", "earthapp", "electron", "eui", "node", "react")
    val modules = listOf("main", "renderer")
    
    typischPacks.forEach { p ->
        include(":typisch:packs:$p")
    }
    modules.forEach { m ->
        include(":modules:$m")
    }

## ./gradle/wrapper/gradle-wrapper.properties
    
    distributionBase=GRADLE_USER_HOME
    distributionPath=wrapper/dists
    distributionUrl=https\://services.gradle.org/distributions/gradle-7.6-all.zip
    # https://gradle.org/release-checksums/
    distributionSha256Sum=312eb12875e1747e05c2f81a4789902d7e4ec5defbd1eefeaccc08acf096505d
    zipStoreBase=GRADLE_USER_HOME
    zipStorePath=wrapper/dists

## ./modules/renderer/esbuild.mjs
    
    #!/usr/bin/env -S npx node
    
    import * as esbuild from "esbuild";
    import yargs from "yargs";
    
    const args = yargs(process.argv)
        .option("indir", {
            type: "string",
        })
        .option("rootdir", {
            type: "string",
        })
        .option("outfile", {
            type: "string",
        })
        .parseSync();
    
    const jsRoot = args.indir;
    
    await esbuild.build({
        entryPoints: [`${jsRoot}/src/renderer/index.js`],
        outfile: args.outfile,
        bundle: true,
        sourcemap: true,
        plugins: [
            {
                name: 'resolver',
                setup(build) {
                    // EUI imports must be specified from @elastic/eui/src, but the actual compiled ESM JS files are in .../es,
                    // so make a custom resolver for that. TODO surely this is overkill and all we need is the right config param or plugin
                    build.onResolve({ filter: /^@elastic\/eui\/src\// }, async (args) => {
                        const result = await build.resolve(args.path.replace("@elastic/eui/src", "@elastic/eui/lib"), { // TODO WHYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY did i have to make this LIB to prevent both versions being imported, when the same config works fine in otherproject admin client????????? ALSO JUST FIX THIS *&(#@$*U@#(*$*$#^($# SITUATION WITH THE IMPORTS BEING THAT WAY
                            resolveDir: args.resolveDir,
                        });
    
                        // const result = await build.resolve(args.path.replace("@elastic/eui/src", "@elastic/eui/es"), { resolveDir: args.resolveDir })
                        if (result.errors.length > 0) {
                            return { errors: result.errors }
                        }
                        return { path: result.path };
                    });
    
                },
            },
        ]
    });

## ./modules/renderer/index.scss

    // NOTE: gradle does not check these for changes, so if you update these, increase this number: [3]
    @import "../../node_modules/@elastic/eui/dist/eui_theme_dark";
    
    html {
      height: 100%;
    }
    body {
      height: 100%;
    }
    #root {
      height: 100%;
    }

## ./renderer/index.html

    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="UTF-8">
            <title>SuperApp</title>
    
            <link rel="stylesheet" href="index.css">
            <!-- TODO local - https://elastic.github.io/eui/#/guidelines/getting-started#fonts -->
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:slnt,wght@-10,300..700;0,300..700&family=Roboto+Mono:ital,wght@0,400..700;1,400..700&display=swap" />
    
            <meta name="mobile-web-app-capable" content="yes" />
    
            <script type="application/javascript">
                if (!window.process) {
                    window.process = {
                        type: 'renderer',
                        isNotElectron: true,
                        env: {
                            NODE_ENV: 'development',
                        },
                    };
                }
            </script>
            <script type="module" src="index.js"></script>
        </head>
        <body>
            <div id="root"></div>
        </body>
    </html>
