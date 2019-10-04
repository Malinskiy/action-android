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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const exec_with_result_1 = __importDefault(require("./exec-with-result"));
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
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield exec_with_result_1.default(`bash -c \\\"${this.sdk.androidHome()}/tools/emulator @${this.name} -no-snapshot-save &\"`);
            let booted = yield this.waitForBoot();
            console.log(`booted=${booted}`);
            return;
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            yield exec_with_result_1.default(`bash -c \\\"${this.sdk.androidHome()}/platform-tools/adb -s emulator-${this.adbPort} emu kill\"`);
            console.log("emu kill finished");
            return;
        });
    }
    waitForBoot() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let countdown = 120; countdown > 0; countdown--) {
                if (countdown == 0) {
                    console.error("Timeout waiting for the emulator");
                    return false;
                }
                try {
                    let output = yield exec_with_result_1.default(`${this.sdk.androidHome()}/platform-tools/adb shell getprop sys.boot_completed | tr -d '\r' `);
                    if (output == '1') {
                        countdown = 0;
                        console.log("Emulator booted");
                        return true;
                    }
                }
                catch (e) {
                    console.error(e.message);
                }
                console.log("Sleeping for 1s");
                yield sleep(1000);
                countdown--;
            }
            console.log("Timeout waiting for emulator to boot. Exiting");
            return false;
        });
    }
}
exports.Emulator = Emulator;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
