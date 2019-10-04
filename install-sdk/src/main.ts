import * as core from '@actions/core';
import {InputOptions} from "@actions/core/lib/core";
import {SdkFactory} from "./sdk";

async function run() {
    try {
        let url = core.getInput('url', <InputOptions>{required: false});
        if (url == null || url == "") {
            console.log(`Android SDK URL is not set. Using default`)
        }

        let acceptLicense = core.getInput('acceptLicense')
        if (acceptLicense !== "yes") {
            core.setFailed('You can\'t use this unless you accept the Android SDK licenses')
            return
        }

        console.log("Installing Android Sdk")
        let sdk = new SdkFactory().getAndroidSdk();
        await sdk.install(url)

        console.log("Accepting Android SDK licenses")
        await sdk.acceptLicense()
    } catch (error) {
        core.setFailed(error.message);
        return
    }
}

run();
