import execWithResult from "./exec-with-result";
import {AndroidSDK} from "./sdk";

export class Emulator {
    private sdk: AndroidSDK;
    private readonly name: string;
    private api: string;
    private abi: string;
    private tag: string;
    private adbPort: number;
    private telnetPort: number;

    public constructor(sdk: AndroidSDK,
                       name: string,
                       api: string,
                       abi: string,
                       tag: string,
                       adbPort: number,
                       telnetPort: number) {
        this.sdk = sdk
        this.name = name;
        this.api = api;
        this.abi = abi;
        this.tag = tag;
        this.adbPort = adbPort;
        this.telnetPort = telnetPort;
    }

    async start(): Promise<any> {
        await execWithResult(`bash -c \\\"${this.sdk.androidHome()}/tools/emulator @${this.name} -no-snapshot-save &\"`)
        return await this.waitForBoot()
    }

    async stop(): Promise<any> {
        await execWithResult(`bash -c \\\"${this.sdk.androidHome()}/platform-tools/adb -s emulator-${this.adbPort} emu kill\"`)
        console.log("emu kill finished")
        let booted = await this.waitForBoot();
        console.log(`booted=${booted}`)
        return
    }

    async waitForBoot(): Promise<boolean> {
        for (let countdown = 120; countdown > 0; countdown--) {
            if (countdown == 0) {
                console.error("Timeout waiting for the emulator")
                return false
            }
            try {
                let output = await execWithResult(`${this.sdk.androidHome()}/platform-tools/adb shell getprop sys.boot_completed | tr -d '\r' `)
                if (output == '1') {
                    countdown = 0
                    console.log("Emulator booted")
                    return true
                }
            } catch (e) {
                console.error(e.message)
            }

            console.log("Sleeping for 1s")
            await sleep(1000)
            countdown--
        }
        console.log("Timeout waiting for emulator to boot. Exiting")
        return false
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
