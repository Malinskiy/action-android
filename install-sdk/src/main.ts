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
        let sdk = new SdkFactory().getAndroidSdk();
        console.log("Accepting Android SDK licenses")
        await sdk.acceptLicense()
        console.log("Installing Android Sdk")
        await sdk.install(url)

    } catch (error) {
        if(error !instanceof Error) {
            core.setFailed(error.message);
        } else {
            core.setFailed("unknown (error !instanceof Error) occurred")
        }

        return
    }
}

run();
