import execWithResult from "./exec-with-result";
import {androidHome} from "./sdk";

export async function installEmulatorPackage(api: string, tag: string, abi: string): Promise<any> {
    await execWithResult(`${androidHome()}/tools/bin/sdkmanager`, [`system-images;android-${api};${tag};${abi}`, "--verbose"]);
}

export async function createEmulator(name: string, api: string, tag: string, abi: string): Promise<any> {
    await execWithResult(`${androidHome()}/tools/bin/avdmanager create avd -n "${name}" --package "system-images;android-${api};${tag};${abi}" --tag ${tag}`)
}

export async function startEmulator(name: string): Promise<boolean> {
    await execWithResult(`${androidHome()}/tools/emulator @${name}`)
    return await waitForBoot()
}

async function waitForBoot(): Promise<boolean> {
    let countdown = 120
    while (await execWithResult(`${androidHome()}/platform-tools/adb shell getprop sys.boot_completed | tr -d '\r' `) !== '1') {
        if (countdown == 0) {
            console.error("Timeout waiting for the emulator")
            return false
        }
        await sleep(1000)
        countdown--
    }
    return true
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
