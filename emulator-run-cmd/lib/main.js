"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
                tag = 'default';
            }
            let verbose = false;
            if (core.getInput('verbose') == "true") {
                verbose = true;
            }
            let cmd = core.getInput('cmd', { required: true });
            if (cmd === "") {
                console.error("Please specify cmd to execute in parallel with emulator");
                return;
            }
            let cmdOptions = core.getInput('cmdOptions');
            if (cmdOptions == null) {
                cmdOptions = "-no-snapshot-save -noaudio -no-boot-anim";
            }
            let hardwareProfile = core.getInput('hardwareProfile');
            if (hardwareProfile == null) {
                hardwareProfile = "";
            }
            let disableAnimations = false;
            if (core.getInput('disableAnimations') == "true") {
                disableAnimations = true;
            }
            let bootTimeout = core.getInput('bootTimeout');
            if (bootTimeout == null) {
                bootTimeout = '600';
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
                let emulator = yield sdk.createEmulator("emulator", api, tag, abi, hardwareProfile);
                console.log("starting adb server");
                yield sdk.startAdbServer();
                let booted = yield emulator.start(cmdOptions, +bootTimeout);
                if (!booted) {
                    core.setFailed("emulator boot failed");
                    yield emulator.stop();
                    return;
                }
                //Pre-setup
                yield emulator.unlock();
                if (disableAnimations) {
                    yield emulator.disableAnimations();
                }
                yield emulator.startLogcat();
                console.log("emulator started and booted");
                try {
                    let result = yield (0, exec_with_result_1.default)(`${cmd}`);
                    let code = result.exitCode;
                    if (code != 0) {
                        core.setFailed(`process exited with code ${code}`);
                    }
                }
                catch (e) {
                    if (e instanceof Error) {
                        core.setFailed(e.message);
                    }
                    else {
                        core.setFailed("unknown (error !instanceof Error) occurred");
                    }
                }
                console.log("stopping emulator");
                yield emulator.stop();
                yield emulator.stopLogcat();
                console.log("emulator is stopped");
            }
            catch (error) {
                console.error(error);
                if (error instanceof Error) {
                    core.setFailed(error.message);
                }
                else {
                    core.setFailed("unknown (error !instanceof Error) occurred");
                }
                return;
            }
        }
        catch (error) {
            if (error instanceof Error) {
                core.setFailed(error.message);
            }
            else {
                core.setFailed("unknown (error !instanceof Error) occurred");
            }
            return;
        }
    });
}
run();
