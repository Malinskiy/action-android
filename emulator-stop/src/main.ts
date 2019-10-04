import * as core from '@actions/core';
import {SdkFactory} from "./sdk";
import {Emulator} from "./emulator";

async function run() {
    try {
        const androidHome = process.env.ANDROID_HOME
        console.log(`ANDROID_HOME is ${androidHome}`)
        console.log(`PATH is ${process.env.PATH}`)

        let sdk = new SdkFactory().getAndroidSdk();

        try {
            let emulator: Emulator = await sdk.listRunningEmulators()[0]
            await emulator.stop()
        } catch (error) {
            console.error(error)
            core.setFailed(error.message);
            return
        }
    } catch (error) {
        core.setFailed(error.message);
        return
    }
}

run();
