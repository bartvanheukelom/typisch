plugins {
    id("de.undercouch.download") version "4.1.2"
}

import java.util.concurrent.locks.ReentrantLock
import de.undercouch.gradle.tasks.download.Download

val srcCommon = file("src/common")
val srcMain = file("src/main")
val srcTypisch = file("typisch/src")
val srcRenderer = file("src/renderer")
val buildTscMain = File(buildDir, "tsc/main")
val buildTscRenderer = File(buildDir, "tsc/renderer")
val buildRollupMain = File(buildDir, "rollup/main")
val buildRollupRenderer = File(buildDir, "rollup/renderer")

val srcLock = ReentrantLock()

tasks {

    val tscMain by registering {
        val configFile = file("src/main/tsconfig.json")

    	inputs.file(configFile)
        inputs.dir(srcMain)
        inputs.dir(srcCommon)
        inputs.dir(srcTypisch)
        outputs.dir(buildTscMain)

        doLast {
			delete(buildTscMain)
			val tmp = File(srcRenderer.absolutePath + "_disabled")
			srcLock.lock()
			try {
				srcRenderer.renameTo(tmp)
				exec {
					commandLine("npx", "tsc", "--build", configFile.absolutePath)
					standardOutput = System.out
					errorOutput = System.err
				}
			} finally {
				if (tmp.exists()) {
					check(!srcRenderer.exists())
					tmp.renameTo(srcRenderer)
				}
				srcLock.unlock()
			}
			check(!File(buildTscMain, "renderer").exists()) {
				"Modules from src/renderer ended up in tsc.main output. Check for rogue imports."
			}
		}
    }

    val tscRenderer by registering {
		val configFile = file("src/renderer/tsconfig.json")

		inputs.file(configFile)
		inputs.dir(srcRenderer)
		inputs.dir(srcCommon)
        inputs.dir(srcTypisch)
		outputs.dir(buildTscRenderer)

        doLast {
			delete(buildTscRenderer)
			val tmp = File(srcMain.absolutePath + "_disabled")
			srcLock.lock()
			try {
				srcMain.renameTo(tmp)
				exec {
					commandLine("npx", "tsc", "--build", configFile.absolutePath)
					standardOutput = System.out
					errorOutput = System.err
				}
			} finally {
				if (tmp.exists()) {
					check(!srcMain.exists())
					tmp.renameTo(srcMain)
				}
				srcLock.unlock()
			}
			check(!File(buildTscRenderer, "main").exists()) {
				"Modules from src/main ended up in tsc.renderer output. Check for rogue imports."
			}
		}
	}

	val rollupMain by registering(Exec::class) {
		dependsOn(tscMain)
		val configFile = file("rollup.main.js")
		inputs.file(configFile)
		inputs.dir(buildTscMain)
		outputs.dir(buildRollupMain)
		doFirst {
			delete(buildRollupMain)
		}
		commandLine("npx", "rollup", "-c", configFile.absolutePath)
		standardOutput = System.out
		errorOutput = System.err
	}

	val rollupRenderer by registering(Exec::class) {
		dependsOn(tscRenderer)
		val configFile = file("rollup.renderer.js")
		inputs.file(configFile)
		inputs.dir(buildTscRenderer)
		outputs.dir(buildRollupRenderer)
		doFirst {
			delete(buildRollupRenderer)
		}
		commandLine("npx", "rollup", "-c", configFile.absolutePath)
		standardOutput = System.out
		errorOutput = System.err
	}

	val copyRenderer by registering(Copy::class) {
		dependsOn(rollupRenderer)
		from(
			// dirs
			file("renderer"),
			buildRollupRenderer,
			// files
			file("node_modules/@elastic/eui/dist/eui_theme_amsterdam_dark.css"),
			file("node_modules/cropperjs/dist/cropper.css")
		)
		into(File(buildDir, "renderer"))
	}

	val rdtDownload by registering(Download::class) {
		src("https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3&x=id%3Dfmkadmapgofadopljbjfkapdkoienihi%26uc&prodversion=32")
		dest(File(buildDir, "rdt/crx.zip"))
		onlyIfModified(true)
	}

	val rdtExtract by registering(Exec::class) {
		dependsOn(rdtDownload)
		val zipFile = File(buildDir, "rdt/crx.zip") // TODO get from rdtDownload?
		val outDir = File(buildDir, "rdt/extract")
		inputs.file(zipFile)
		outputs.dir(outDir)
		doFirst {
			delete(outDir)
			mkdir(outDir)
		}
		// use unzip because Gradle zipTree seemingly can't handle the extra prefix bytes in the zip
		commandLine("unzip", zipFile.absolutePath)
		workingDir(outDir)
		standardOutput = System.out
		errorOutput = System.err
		setIgnoreExitValue(true) // unzip returns an error code because of the prefix, but works fine
	}

	val preNpmStart by registering {
		dependsOn(
			rollupMain,
			copyRenderer,
			rdtExtract,
		)
	}

}
