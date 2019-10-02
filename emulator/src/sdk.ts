import * as core from "@actions/core";
import execWithResult from "./exec-with-result";
import * as fs from "fs";
import {writeFile} from "fs";
import * as util from "util";
import {exec} from "@actions/exec/lib/exec";
import {Emulator} from "./emulator";

const ANDROID_TMP_PATH = "/tmp/android-sdk.zip"

let writeFileAsync = util.promisify(writeFile)

export interface AndroidSDK {
    sdkUrl: string

    install(): Promise<boolean>;

    androidHome(): string

    acceptLicense(): Promise<any>

    installEmulatorPackage(api: string, tag: string, abi: string, verbose: boolean): Promise<any>

    installPlatform(api: string, verbose: boolean): Promise<any>

    createEmulator(name: string, api: string, tag: string, abi: string): Promise<Emulator>

    listEmulators(): Promise<any>

    verifyHardwareAcceleration(): Promise<boolean>
}

abstract class BaseAndroidSdk implements AndroidSDK {
    abstract sdkUrl: string

    async install(): Promise<boolean> {
        const ANDROID_HOME = this.androidHome()

        if (fs.existsSync(`${process.env.HOME}/.android`)) {
            await execWithResult(`mv ${process.env.HOME}/.android ${process.env.HOME}/.android.backup`)
        }

        await execWithResult(`curl -L ${this.sdkUrl} -o ${ANDROID_TMP_PATH} -s`)
        await execWithResult(`unzip -q ${ANDROID_TMP_PATH} -d ${ANDROID_HOME}`)
        await execWithResult(`rm ${ANDROID_TMP_PATH}`)
        await execWithResult(`mkdir -p ${ANDROID_HOME}/sdk_home`)

        core.exportVariable('ANDROID_HOME', `${ANDROID_HOME}`);
        core.exportVariable('ANDROID_SDK_ROOT', `${ANDROID_HOME}`);
        core.exportVariable('ANDROID_SDK_HOME', `${ANDROID_HOME}/sdk_home`);

        const PATH = process.env.PATH!!
        let extraPaths = `${ANDROID_HOME}/bin:${ANDROID_HOME}/tools:${PATH}/tools/bin:${PATH}/platform-tools/bin`

        let PATH_WITHOUT_ANDROID = PATH.split(':').filter(entry => {
            !entry.includes("Android")
        })

        core.exportVariable('PATH', `${PATH_WITHOUT_ANDROID}:${extraPaths}`)
        return true
    }

    androidHome(): string {
        return `${process.env.HOME}/android-sdk`
    }

    async acceptLicense(): Promise<any> {
        await execWithResult(`mkdir -p ${this.androidHome()}/licenses`)

        await writeLicenseFile(`${this.androidHome()}/licenses/android-sdk-license`, "8933bad161af4178b1185d1a37fbf41ea5269c55\n" +
            "d56f5187479451eabf01fb78af6dfcb131a6481e\n" +
            "24333f8a63b6825ea9c5514f83c2829b004d1fee")
        await writeLicenseFile(`${this.androidHome()}/licenses/android-sdk-preview-license`, "84831b9409646a918e30573bab4c9c91346d8abd\n")
        await writeLicenseFile(`${this.androidHome()}/licenses/intel-android-extra-license`, "d975f751698a77b662f1254ddbeed3901e976f5a\n")
        await writeLicenseFile(`${this.androidHome()}/licenses/mips-android-sysimage-license`, "e9acab5b5fbb560a72cfaecce8946896ff6aab9d\n")
        await writeLicenseFile(`${this.androidHome()}/licenses/google-gdk-license`, "33b6a2b64607f11b759f320ef9dff4ae5c47d97a\n")
        await writeLicenseFile(`${this.androidHome()}/licenses/android-googletv-license`, "601085b94cd77f0b54ff86406957099ebe79c4d6\n")
    }

    async installEmulatorPackage(api: string, tag: string, abi: string, verbose: boolean): Promise<any> {
        let args = ""
        if (!verbose) {
            args += " > /dev/null"
        }

        await execWithResult(`bash -c \\\"${this.androidHome()}/tools/bin/sdkmanager emulator tools platform-tools 'system-images;android-${api};${tag};${abi}'${args}"`);
    }

    async installPlatform(api: string, verbose: boolean): Promise<any> {
        let args = ""
        if (!verbose) {
            args += " > /dev/null"
        }

        await execWithResult(`bash -c \\\"${this.androidHome()}/tools/bin/sdkmanager 'platforms;android-${api}'${args}"`)
    }

    async createEmulator(name: string, api: string, tag: string, abi: string): Promise<any> {
        await execWithResult(`bash -c \\\"echo -n no | ${this.androidHome()}/tools/bin/avdmanager create avd -n ${name} --package \\\"system-images;android-${api};${tag};${abi}\\\" --tag ${tag}\"`)
        return new Emulator(this, name, api, abi, tag)
    }

    async verifyHardwareAcceleration(): Promise<boolean> {
        try {
            let exitCode = await exec(`${this.androidHome()}/tools/emulator -accel-check`);
            return exitCode == 0
        } catch (e) {
            return false
        }
    }

    async listEmulators(): Promise<any> {
        await execWithResult(`${this.androidHome()}/tools/emulator -list-avds`)
    }
}

class LinuxAndroidSdk extends BaseAndroidSdk {
    sdkUrl = "https://dl.google.com/android/repository/sdk-tools-linux-4333796.zip"
}

class MacOSAndroidSdk extends BaseAndroidSdk {
    sdkUrl = "https://dl.google.com/android/repository/sdk-tools-darwin-4333796.zip"
}

export class SdkFactory {
    getAndroidSdk(): AndroidSDK {
        switch (process.platform) {
            case "linux":
                return new LinuxAndroidSdk()
            case "darwin":
                return new MacOSAndroidSdk()
            default:
                throw new Error("Unsupported OS")
        }
    }
}

async function writeLicenseFile(file: string, content: string) {
    await writeFileAsync(file, content)
}
