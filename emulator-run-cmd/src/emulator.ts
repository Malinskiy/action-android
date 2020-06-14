import execWithResult, {execIgnoreFailure} from "./exec-with-result";
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

    async start(cmdOptions: String): Promise<Boolean> {
        await execIgnoreFailure(`bash -c \\\"${this.sdk.emulatorCmd()} @${this.name} ${cmdOptions} &\"`)
        let booted = await this.waitForBoot();
        console.log(`booted=${booted}`)
        return booted
    }

    async stop(): Promise<any> {
        await execIgnoreFailure(`bash -c \\\"${this.sdk.androidHome()}/platform-tools/adb -s emulator-${this.adbPort} emu kill\"`)
        console.log("emu kill finished")
        return
    }

    async waitForBoot(): Promise<boolean> {
        for (let countdown = 300; countdown > 0; countdown--) {
            if (countdown == 0) {
                console.error("Timeout waiting for the emulator")
                return false
            }
            try {
                let output = await this.execAdbCommand("shell getprop sys.boot_completed")
                if (output.trim() == '1') {
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

    async unlock(): Promise<any> {
        await this.execAdbCommand("shell input keyevent 82")
    }

    async disableAnimations(): Promise<any> {
        console.log('Disabling animations');
        try {
            await this.execAdbCommand("shell settings put global window_animation_scale 0.0")
            await this.execAdbCommand("shell settings put global transition_animation_scale 0.0")
            await this.execAdbCommand("shell settings put global animator_duration_scale 0.0")
        } catch (e) {
            console.warn("error disabling animations. skipping")
        }
    }

    async execAdbCommand(args: String): Promise<string> {
        return await execIgnoreFailure(`${this.sdk.androidHome()}/platform-tools/adb -s emulator-${this.adbPort} ${args}`)
    }

    async startLogcat(): Promise<any> {
        console.log('Starting logcat read process');
        try {
            await execIgnoreFailure(`mkdir -p artifacts`)
            await execIgnoreFailure(`bash -c \\\"${this.sdk.androidHome()}/platform-tools/adb -s emulator-${this.adbPort} logcat -dv time > artifacts/logcat.log &\"`)
        } catch (e) {
            console.warn("can't start logcat read process. skipping")
        }
    }

    async stopLogcat(): Promise<any> {
        console.log('Stopping logcat read process');
        try {
            await execIgnoreFailure(`kill $(jobs -p)`)
        } catch (e) {
            console.warn("can't stop logcat read process. skipping")
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
