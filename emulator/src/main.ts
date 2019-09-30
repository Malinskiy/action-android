import * as core from '@actions/core';
import execWithResult from './exec-with-result'
import * as fs from "fs";
import {InputOptions} from "@actions/core/lib/core";
import installAndroidSdk, {acceptLicenses} from "./sdk";
import {installEmulatorPackage, listEmulators, startEmulator, verifyHardwareAcceleration} from "./emulator";
import {createEmulator} from "./emulator";

async function run() {
    try {
        let api = core.getInput('api', <InputOptions>{required: false});
        if (api == null || api == "") {
            console.log(`API not set. Using 25`)
            api = '25'
        }

        let abi = core.getInput('abi', <InputOptions>{required: false});
        if (abi == null || abi == "") {
            console.log(`ABI not set. Using armeabi-v7a`)
            abi = 'armeabi-v7a'
        }

        let tag = core.getInput('tag', <InputOptions>{required: false})
        if (tag !== "default" && tag !== "google_apis") {
            console.log(`Unknown tag ${tag}. Using default`)
            tag = 'google_apis'
        }

        let acceptLicense = core.getInput('acceptLicense')
        if (acceptLicense !== "yes") {
            core.setFailed('You can\'t use this unless you accept the Android SDK licenses')
            return
        }

        console.log("Installing Android SDK")
        await installAndroidSdk()
        await acceptLicenses()

        console.log(`Starting emulator with API=${api}, TAG=${tag} and ABI=${abi}...`)

        const androidHome = process.env.ANDROID_HOME
        console.log(`ANDROID_HOME is ${androidHome}`)
        console.log(`PATH is ${process.env.PATH}`)

        try {
            await installEmulatorPackage(api, tag, abi)

            let supportsHardwareAcceleration = await verifyHardwareAcceleration();
            // if (!supportsHardwareAcceleration && abi == "x86") {
            //     core.setFailed('Hardware acceleration is not supported')
            //     return
            // }

            await createEmulator("emulator", api, tag, abi)

            console.log(`Available emulators: ${await listEmulators()}`)

            await startEmulator("emulator")
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
