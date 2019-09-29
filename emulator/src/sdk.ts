import * as core from "@actions/core";
import execWithResult from "./exec-with-result";
import * as fs from "fs";
import * as path from "path";

const URL_LINUX = "https://dl.google.com/android/repository/sdk-tools-linux-4333796.zip"
const ANDROID_TMP_PATH = "/tmp/android-sdk.zip"

/**
 * Assuming that we will only run on Linux for now
 */
export default async function installAndroidSdk(): Promise<boolean> {
    const ANDROID_HOME = androidHome()

    await execWithResult(`curl -L ${URL_LINUX} -o ${ANDROID_TMP_PATH} -s`)
    await execWithResult(`unzip -q ${ANDROID_TMP_PATH} -d ${ANDROID_HOME}`)
    await execWithResult(`rm ${ANDROID_TMP_PATH}`)

    core.exportVariable('ANDROID_HOME', `${ANDROID_HOME}`);

    const PATH = process.env.PATH
    let extraPaths = `${ANDROID_HOME}/bin:${ANDROID_HOME}/tools:${PATH}/tools/bin:${PATH}/platform-tools/bin`

    core.exportVariable('PATH', `${PATH}:${extraPaths}`)
    return true
}

export function androidHome(): string {
    return `${process.env.HOME}/android-sdk`
}

export async function acceptLicenses() {
    await execWithResult(`mkdir -p ${androidHome()}/licenses`)

    await writeLicenseFile(`${androidHome()}/licenses/android-sdk-license`, "8933bad161af4178b1185d1a37fbf41ea5269c55\n" +
        "d56f5187479451eabf01fb78af6dfcb131a6481e\n" +
        "24333f8a63b6825ea9c5514f83c2829b004d1fee")
    await writeLicenseFile(`${androidHome()}/licenses/android-sdk-preview-license`, "84831b9409646a918e30573bab4c9c91346d8abd\n")
    await writeLicenseFile(`${androidHome()}/licenses/intel-android-extra-license`, "d975f751698a77b662f1254ddbeed3901e976f5a\n")
    await writeLicenseFile(`${androidHome()}/licenses/mips-android-sysimage-license`, "e9acab5b5fbb560a72cfaecce8946896ff6aab9d\n")
    await writeLicenseFile(`${androidHome()}/licenses/google-gdk-license`, "33b6a2b64607f11b759f320ef9dff4ae5c47d97a\n")
    await writeLicenseFile(`${androidHome()}/licenses/android-googletv-license`, "601085b94cd77f0b54ff86406957099ebe79c4d6\n")
}

async function writeLicenseFile(file: string, content: string) {
    await fs.writeFile.__promisify__(file, content)
}
