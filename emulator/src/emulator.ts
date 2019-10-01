import execWithResult from "./exec-with-result";
import {AndroidSDK} from "./sdk";

export class Emulator {
    private sdk: AndroidSDK;
    private name: string;
    private api: string;
    private abi: string;
    private tag: string;

    public constructor(sdk: AndroidSDK, name: string, api: string, abi: string, tag: string) {
        this.sdk = sdk
        this.name = name;
        this.api = api;
        this.abi = abi;
        this.tag = tag;
    }

    async start(): Promise<any> {
        await execWithResult(`${this.sdk.androidHome()}/tools/emulator @${this.name} &`)
        return await this.waitForBoot()
    }

    async waitForBoot(): Promise<boolean> {
        let countdown = 120
        while (await execWithResult(`${this.sdk.androidHome()}/platform-tools/adb shell getprop sys.boot_completed | tr -d '\r' `) !== '1') {
            if (countdown == 0) {
                console.error("Timeout waiting for the emulator")
                return false
            }
            await sleep(1000)
            countdown--
        }
        return true
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
