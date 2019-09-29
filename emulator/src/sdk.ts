import * as core from "@actions/core";
import execWithResult from "./exec-with-result";

const URL_LINUX = "https://dl.google.com/android/repository/sdk-tools-linux-4333796.zip"
const ANDROID_HOME = "/usr/local/lib/android/sdk"
const ANDROID_TMP_PATH = "/tmp/android-sdk.zip"

/**
 * Assuming that we will only run on Linux for now
 */
export default async function installAndroidSdk(): Promise<boolean> {
    await execWithResult(`curl -L ${URL_LINUX} > ${ANDROID_TMP_PATH}`)
    await execWithResult(`unzip -q ${ANDROID_TMP_PATH} -d ${ANDROID_HOME}`)
    await execWithResult(`rm ${ANDROID_TMP_PATH}`)

    core.exportVariable('ANDROID_HOME', `${ANDROID_HOME}`);
    return true
}
