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
    defaultSdkUrl: string

    install(url: string): Promise<boolean>;

    androidHome(): string

    acceptLicense(): Promise<any>

    installEmulatorPackage(api: string, tag: string, abi: string, verbose: boolean): Promise<any>

    installPlatform(api: string, verbose: boolean): Promise<any>

    createEmulator(name: string, api: string, tag: string, abi: string): Promise<Emulator>

    listEmulators(): Promise<any>

    listRunningEmulators(): Promise<Array<Emulator>>

    startAdbServer(): Promise<any>

    verifyHardwareAcceleration(): Promise<boolean>
}

export abstract class BaseAndroidSdk implements AndroidSDK {
    abstract defaultSdkUrl: string

    portCounter: number = 5554

    async install(url: string): Promise<boolean> {
        const ANDROID_HOME = this.androidHome()

        let sdkUrl: string = url
        if (sdkUrl == null || sdkUrl == "") {
            sdkUrl = this.defaultSdkUrl
        }

        if (fs.existsSync(`${process.env.HOME}/.android`)) {
            await execWithResult(`mv ${process.env.HOME}/.android ${process.env.HOME}/.android.backup`)
        }

        await execWithResult(`curl -L ${sdkUrl} -o ${ANDROID_TMP_PATH} -s`)
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
        await execWithResult(`bash -c \\\"yes | ${this.androidHome()}/tools/bin/sdkmanager --licenses"`);
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
        return new Emulator(this, name, api, abi, tag, this.portCounter++, this.portCounter++)
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

    async listRunningEmulators(): Promise<Array<Emulator>> {
        let output = await execWithResult(`${this.androidHome()}/platform-tools/adb devices`)
        return await this.parseDevicesOutput(output);
    }

    async parseDevicesOutput(output: string): Promise<Array<Emulator>> {
        let result = new Array<Emulator>()

        let lines = output.split(/\r?\n/);
        for (let line in lines) {
            if (line.startsWith("emulator")) {
                let split = line.split(" ");
                let serial = split[0];
                let port = serial.split("-")[1]
                let nameOutput = await execWithResult(`${this.androidHome()}/platform-tools/adb adb -s ${serial} emu avd name`)
                let nameLines = nameOutput.split(/\r?\n/);
                let name = nameLines[0];

                result.fill(new Emulator(this, name, "", "", "", parseInt(port), parseInt(port) + 1))
            }
        }
        return result;
    }

    async startAdbServer(): Promise<any> {
        await execWithResult(`${this.androidHome()}/platform-tools/adb start-server`)
    }
}

class LinuxAndroidSdk extends BaseAndroidSdk {
    defaultSdkUrl = "https://dl.google.com/android/repository/sdk-tools-linux-4333796.zip"
}

class MacOSAndroidSdk extends BaseAndroidSdk {
    defaultSdkUrl = "https://dl.google.com/android/repository/sdk-tools-darwin-4333796.zip"
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
