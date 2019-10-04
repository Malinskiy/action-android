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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const sdk_1 = require("./sdk");
const exec_with_result_1 = __importDefault(require("./exec-with-result"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let api = core.getInput('api', { required: false });
            if (api == null || api == "") {
                console.log(`API not set. Using 25`);
                api = '25';
            }
            let abi = core.getInput('abi', { required: false });
            if (abi == null || abi == "") {
                console.log(`ABI not set. Using armeabi-v7a`);
                abi = 'armeabi-v7a';
            }
            let tag = core.getInput('tag', { required: false });
            if (tag !== "default" && tag !== "google_apis") {
                console.log(`Unknown tag ${tag}. Using default`);
                tag = 'google_apis';
            }
            let verbose = false;
            if (core.getInput('verbose') == "yes") {
                verbose = true;
            }
            let cmd = core.getInput('cmd', { required: true });
            if (cmd === "") {
                console.error("Please specify cmd to execute in parallel with emulator");
                return;
            }
            console.log(`Starting emulator with API=${api}, TAG=${tag} and ABI=${abi}...`);
            const androidHome = process.env.ANDROID_HOME;
            console.log(`ANDROID_HOME is ${androidHome}`);
            console.log(`PATH is ${process.env.PATH}`);
            let sdk = new sdk_1.SdkFactory().getAndroidSdk();
            try {
                yield sdk.installEmulatorPackage(api, tag, abi, verbose);
                yield sdk.installPlatform(api, verbose);
                let supportsHardwareAcceleration = yield sdk.verifyHardwareAcceleration();
                if (!supportsHardwareAcceleration && abi == "x86") {
                    core.setFailed('Hardware acceleration is not supported');
                    return;
                }
                let emulator = yield sdk.createEmulator("emulator", api, tag, abi);
                console.log("starting adb server");
                yield sdk.startAdbServer();
                yield emulator.start();
                console.log("emulator started and booted");
                try {
                    yield exec_with_result_1.default(`${cmd}`);
                }
                catch (e) {
                    //ignore
                }
                console.log("stopping emulator");
                yield emulator.stop();
                console.log("emulator is stopped");
            }
            catch (error) {
                console.error(error);
                core.setFailed(error.message);
                return;
            }
        }
        catch (error) {
            core.setFailed(error.message);
            return;
        }
    });
}
run();
