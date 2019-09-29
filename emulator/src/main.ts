import * as core from '@actions/core';
import execWithResult from './exec-with-result'
import * as fs from "fs";
import {InputOptions} from "@actions/core/lib/core";
import installAndroidSdk from "./sdk";
import {installEmulatorPackage, startEmulator} from "./emulator";
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
            console.log(`ABI not set. Using x86`)
            abi = 'x86'
        }

        let tag = core.getInput('tag', <InputOptions>{required: false})
        if (tag !== "default" && tag !== "google_apis") {
            console.log(`Unknown tag ${tag}. Using default`)
            tag = 'default'
        }

        console.log("Installing Android SDK")
        await installAndroidSdk()

        console.log(`Starting emulator with API=${api}, TAG=${tag} and ABI=${abi}...`)

        const androidHome = process.env.ANDROID_HOME
        console.log(`ANDROID_HOME is ${androidHome}`)
        console.log(`PATH is ${process.env.PATH}`)

        try {
            await installEmulatorPackage(api, tag, abi)
            await createEmulator("emulator", api, tag, abi)
            await startEmulator("emulator")
        } catch (error) {
            console.error(error)
            core.setFailed(error.message);
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
