import * as core from "@actions/core";
import execWithResult, {execIgnoreFailure} from "./exec-with-result";
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

    emulatorCmd(): string

    acceptLicense(): Promise<any>

    installEmulatorPackage(api: string, tag: string, abi: string, verbose: boolean): Promise<any>

    installPlatform(api: string, verbose: boolean): Promise<any>

    createEmulator(name: string, api: string, tag: string, abi: string, hardwareProfile: string): Promise<Emulator>

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
            await execWithResult(`rm -rf ${process.env.HOME}/.android.backup`)
            await execWithResult(`mv ${process.env.HOME}/.android ${process.env.HOME}/.android.backup`)
        }

        await execWithResult(`curl -L ${sdkUrl} -o ${ANDROID_TMP_PATH} -s`)
        await execWithResult(`unzip -q ${ANDROID_TMP_PATH} -d ${ANDROID_HOME}`)
        await execWithResult(`mv ${ANDROID_HOME}/cmdline-tools ${ANDROID_HOME}/cmdline-tools-tmp`)
        await execWithResult(`mkdir -p ${ANDROID_HOME}/cmdline-tools`)
        await execWithResult(`mv ${ANDROID_HOME}/cmdline-tools-tmp ${ANDROID_HOME}/cmdline-tools/bootstrap-version`)

        await execWithResult(`rm ${ANDROID_TMP_PATH}`)
        await execWithResult(`mkdir -p ${ANDROID_HOME}/sdk_home`)

        core.exportVariable('ANDROID_HOME', `${ANDROID_HOME}`);
        core.exportVariable('ANDROID_SDK_ROOT', `${ANDROID_HOME}`);
        core.exportVariable('ANDROID_SDK_HOME', `${ANDROID_HOME}/sdk_home`);

        const PATH = process.env.PATH!!
        let extraPaths = `${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/cmdline-tools/bootstrap-version/bin:${ANDROID_HOME}/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/platform-tools/bin`

        let PATH_WITHOUT_ANDROID = PATH.split(':').filter(entry => {
            return !entry.includes("Android")
        }).join(':')

        core.exportVariable('PATH', `${extraPaths}:${PATH_WITHOUT_ANDROID}`)
        return true
    }

    androidHome(): string {
        return `${process.env.HOME}/android-sdk`
    }

    emulatorCmd(): string {
        return `${this.androidHome()}/emulator/emulator`;
    }

    async acceptLicense(): Promise<any> {
        await execIgnoreFailure(`mkdir -p ${this.androidHome()}/licenses`)

        await writeLicenseFile(`${this.androidHome()}/licenses/android-sdk-license`, "8933bad161af4178b1185d1a37fbf41ea5269c55\n" +
            "d56f5187479451eabf01fb78af6dfcb131a6481e\n" +
            "24333f8a63b6825ea9c5514f83c2829b004d1fee")
        await writeLicenseFile(`${this.androidHome()}/licenses/android-sdk-preview-license`, "84831b9409646a918e30573bab4c9c91346d8abd\n")
        await writeLicenseFile(`${this.androidHome()}/licenses/intel-android-extra-license`, "d975f751698a77b662f1254ddbeed3901e976f5a\n")
        await writeLicenseFile(`${this.androidHome()}/licenses/mips-android-sysimage-license`, "e9acab5b5fbb560a72cfaecce8946896ff6aab9d\n")
        await writeLicenseFile(`${this.androidHome()}/licenses/google-gdk-license`, "33b6a2b64607f11b759f320ef9dff4ae5c47d97a\n")
        await writeLicenseFile(`${this.androidHome()}/licenses/android-googletv-license`, "601085b94cd77f0b54ff86406957099ebe79c4d6\n")
        await writeLicenseFile(`${this.androidHome()}/licenses/android-sdk-arm-dbt-license`, "859f317696f67ef3d7f30a50a5560e7834b43903")
    }

    async installEmulatorPackage(api: string, tag: string, abi: string, verbose: boolean): Promise<any> {
        let args = ""
        if (!verbose) {
            args += " > /dev/null"
        }

        await execIgnoreFailure(`bash -c \\\"${this.androidHome()}/cmdline-tools/bootstrap-version/bin/sdkmanager emulator 'cmdline-tools;latest' platform-tools 'system-images;android-${api};${tag};${abi}'${args}"`);
    }

    async installPlatform(api: string, verbose: boolean): Promise<any> {
        let args = ""
        if (!verbose) {
            args += " > /dev/null"
        }

        await execIgnoreFailure(`bash -c \\\"${this.androidHome()}/cmdline-tools/bootstrap-version/bin/sdkmanager 'platforms;android-${api}'${args}"`)
    }

    async createEmulator(name: string, api: string, tag: string, abi: string, hardwareProfile: string): Promise<any> {
        let additionalOptions = ""
        if (hardwareProfile != null && hardwareProfile != "") {
            additionalOptions += `--device ${hardwareProfile}`
        }

        await execIgnoreFailure(`bash -c \\\"echo -n no | ${this.androidHome()}/cmdline-tools/bootstrap-version/bin/avdmanager create avd -n ${name} --package \\\"system-images;android-${api};${tag};${abi}\\\" --tag ${tag}\" ${additionalOptions}`)
        return new Emulator(this, name, api, abi, tag, this.portCounter++, this.portCounter++)
    }

    async verifyHardwareAcceleration(): Promise<boolean> {
        try {
            let exitCode = await exec(`${this.emulatorCmd()} -accel-check`);
            return exitCode == 0
        } catch (e) {
            return false
        }
    }

    async listEmulators(): Promise<any> {
        await execIgnoreFailure(`${this.emulatorCmd()} -list-avds`)
    }

    async listRunningEmulators(): Promise<Array<Emulator>> {
        let output = await execIgnoreFailure(`${this.androidHome()}/platform-tools/adb devices`)
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
                let nameOutput = await execIgnoreFailure(`${this.androidHome()}/platform-tools/adb adb -s ${serial} emu avd name`)
                let nameLines = nameOutput.split(/\r?\n/);
                let name = nameLines[0];

                result.fill(new Emulator(this, name, "", "", "", parseInt(port), parseInt(port) + 1))
            }
        }
        return result;
    }

    async startAdbServer(): Promise<any> {
        await execIgnoreFailure(`${this.androidHome()}/platform-tools/adb start-server`)
    }
}

class LinuxAndroidSdk extends BaseAndroidSdk {
    defaultSdkUrl = "https://dl.google.com/android/repository/commandlinetools-linux-6858069_latest.zip"
}

class MacOSAndroidSdk extends BaseAndroidSdk {
    defaultSdkUrl = "https://dl.google.com/android/repository/commandlinetools-mac-9477386_latest.zip"
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
