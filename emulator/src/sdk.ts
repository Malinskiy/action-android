import * as core from "@actions/core";
import execWithResult from "./exec-with-result";

const URL_LINUX = "https://dl.google.com/android/repository/sdk-tools-linux-4333796.zip"
const ANDROID_TMP_PATH = "/tmp/android-sdk.zip"

/**
 * Assuming that we will only run on Linux for now
 */
export default async function installAndroidSdk(): Promise<boolean> {
    let home = process.env.HOME;
    const ANDROID_HOME = `${home}/android-sdk`

    await execWithResult(`curl -L ${URL_LINUX} -o ${ANDROID_TMP_PATH} -s`)
    await execWithResult(`unzip -q ${ANDROID_TMP_PATH} -d ${ANDROID_HOME}`)
    await execWithResult(`rm ${ANDROID_TMP_PATH}`)

    core.exportVariable('ANDROID_HOME', `${ANDROID_HOME}`);

    const PATH = process.env.PATH
    let extraPaths = `${ANDROID_HOME}/bin:${ANDROID_HOME}/tools:${PATH}/tools/bin:${PATH}/platform-tools/bin`

    core.exportVariable('PATH', `${PATH}:${extraPaths}`)
    return true
}
