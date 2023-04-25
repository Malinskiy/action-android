"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Emulator = void 0;
const exec_with_result_1 = require("./exec-with-result");
class Emulator {
    constructor(sdk, name, api, abi, tag, adbPort, telnetPort) {
        this.sdk = sdk;
        this.name = name;
        this.api = api;
        this.abi = abi;
        this.tag = tag;
        this.adbPort = adbPort;
        this.telnetPort = telnetPort;
    }
    start(cmdOptions, bootTimeout) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, exec_with_result_1.execIgnoreFailure)(`bash -c \\\"${this.sdk.emulatorCmd()} @${this.name} ${cmdOptions} &\"`);
            let booted = yield this.waitForBoot(bootTimeout);
            console.log(`booted=${booted}`);
            return booted;
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, exec_with_result_1.execIgnoreFailure)(`bash -c \\\"${this.sdk.androidHome()}/platform-tools/adb -s emulator-${this.adbPort} emu kill\"`);
            console.log("emu kill finished");
            return;
        });
    }
    waitForBoot(timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let countdown = timeout; countdown > 0; countdown--) {
                if (countdown == 0) {
                    console.error("Timeout waiting for the emulator");
                    return false;
                }
                try {
                    let output = yield this.execAdbCommand("shell getprop sys.boot_completed");
                    if (output.trim() == '1') {
                        countdown = 0;
                        console.log("Emulator booted");
                        return true;
                    }
                }
                catch (e) {
                    if (e instanceof Error) {
                        console.error(e.message);
                    }
                    else {
                        console.error(e);
                    }
                }
                console.log("Sleeping for 1s");
                yield sleep(1000);
                countdown--;
            }
            console.log("Timeout waiting for emulator to boot. Exiting");
            return false;
        });
    }
    unlock() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.execAdbCommand("shell input keyevent 82");
        });
    }
    disableAnimations() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Disabling animations');
            try {
                yield this.execAdbCommand("shell settings put global window_animation_scale 0.0");
                yield this.execAdbCommand("shell settings put global transition_animation_scale 0.0");
                yield this.execAdbCommand("shell settings put global animator_duration_scale 0.0");
            }
            catch (e) {
                console.warn("error disabling animations. skipping");
            }
        });
    }
    execAdbCommand(args) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (0, exec_with_result_1.execIgnoreFailure)(`${this.sdk.androidHome()}/platform-tools/adb -s emulator-${this.adbPort} ${args}`);
        });
    }
    startLogcat() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Starting logcat read process');
            try {
                yield (0, exec_with_result_1.execIgnoreFailure)(`mkdir -p artifacts`);
                yield (0, exec_with_result_1.execIgnoreFailure)(`bash -c \\\"${this.sdk.androidHome()}/platform-tools/adb -s emulator-${this.adbPort} logcat -dv time > artifacts/logcat.log &\"`);
            }
            catch (e) {
                console.warn("can't start logcat read process. skipping");
            }
        });
    }
    stopLogcat() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Stopping logcat read process');
            try {
                yield (0, exec_with_result_1.execIgnoreFailure)(`kill $(jobs -p)`);
            }
            catch (e) {
                console.warn("can't stop logcat read process. skipping");
            }
        });
    }
}
exports.Emulator = Emulator;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
