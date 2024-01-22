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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SdkFactory = exports.BaseAndroidSdk = void 0;
const core = __importStar(require("@actions/core"));
const exec_with_result_1 = __importStar(require("./exec-with-result"));
const fs = __importStar(require("fs"));
const fs_1 = require("fs");
const util = __importStar(require("util"));
const exec_1 = require("@actions/exec/lib/exec");
const emulator_1 = require("./emulator");
const ANDROID_TMP_PATH = "/tmp/android-sdk.zip";
let writeFileAsync = util.promisify(fs_1.writeFile);
class BaseAndroidSdk {
    constructor() {
        this.portCounter = 5554;
    }
    install(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const ANDROID_HOME = this.androidHome();
            let sdkUrl = url;
            if (sdkUrl == null || sdkUrl == "") {
                sdkUrl = this.defaultSdkUrl;
            }
            if (fs.existsSync(`${process.env.HOME}/.android`)) {
                yield (0, exec_with_result_1.default)(`rm -rf ${process.env.HOME}/.android.backup`);
                yield (0, exec_with_result_1.default)(`mv ${process.env.HOME}/.android ${process.env.HOME}/.android.backup`);
            }
            yield (0, exec_with_result_1.default)(`curl -L ${sdkUrl} -o ${ANDROID_TMP_PATH} -s`);
            yield (0, exec_with_result_1.default)(`unzip -q ${ANDROID_TMP_PATH} -d ${ANDROID_HOME}`);
            yield (0, exec_with_result_1.default)(`mv ${ANDROID_HOME}/cmdline-tools ${ANDROID_HOME}/cmdline-tools-tmp`);
            yield (0, exec_with_result_1.default)(`mkdir -p ${ANDROID_HOME}/cmdline-tools`);
            yield (0, exec_with_result_1.default)(`mv ${ANDROID_HOME}/cmdline-tools-tmp ${ANDROID_HOME}/cmdline-tools/bootstrap-version`);
            yield (0, exec_with_result_1.default)(`rm ${ANDROID_TMP_PATH}`);
            yield (0, exec_with_result_1.default)(`mkdir -p ${ANDROID_HOME}/sdk_home`);
            core.exportVariable('ANDROID_HOME', `${ANDROID_HOME}`);
            core.exportVariable('ANDROID_SDK_ROOT', `${ANDROID_HOME}`);
            core.exportVariable('ANDROID_SDK_HOME', `${ANDROID_HOME}/sdk_home`);
            const PATH = process.env.PATH;
            let extraPaths = `${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/cmdline-tools/bootstrap-version/bin:${ANDROID_HOME}/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/platform-tools/bin`;
            let PATH_WITHOUT_ANDROID = PATH.split(':').filter(entry => {
                return !entry.includes("Android");
            }).join(':');
            core.exportVariable('PATH', `${extraPaths}:${PATH_WITHOUT_ANDROID}`);
            yield (0, exec_with_result_1.execIgnoreFailure)(`bash -c \\\"${this.androidHome()}/cmdline-tools/bootstrap-version/bin/sdkmanager 'cmdline-tools;latest'`);
            return true;
        });
    }
    androidHome() {
        return `${process.env.HOME}/android-sdk`;
    }
    emulatorCmd() {
        return `${this.androidHome()}/emulator/emulator`;
    }
    acceptLicense() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, exec_with_result_1.execIgnoreFailure)(`mkdir -p ${this.androidHome()}/licenses`);
            yield writeLicenseFile(`${this.androidHome()}/licenses/android-sdk-license`, "8933bad161af4178b1185d1a37fbf41ea5269c55\n" +
                "d56f5187479451eabf01fb78af6dfcb131a6481e\n" +
                "24333f8a63b6825ea9c5514f83c2829b004d1fee");
            yield writeLicenseFile(`${this.androidHome()}/licenses/android-sdk-preview-license`, "84831b9409646a918e30573bab4c9c91346d8abd\n");
            yield writeLicenseFile(`${this.androidHome()}/licenses/intel-android-extra-license`, "d975f751698a77b662f1254ddbeed3901e976f5a\n");
            yield writeLicenseFile(`${this.androidHome()}/licenses/mips-android-sysimage-license`, "e9acab5b5fbb560a72cfaecce8946896ff6aab9d\n");
            yield writeLicenseFile(`${this.androidHome()}/licenses/google-gdk-license`, "33b6a2b64607f11b759f320ef9dff4ae5c47d97a\n");
            yield writeLicenseFile(`${this.androidHome()}/licenses/android-googletv-license`, "601085b94cd77f0b54ff86406957099ebe79c4d6\n");
            yield writeLicenseFile(`${this.androidHome()}/licenses/android-sdk-arm-dbt-license`, "859f317696f67ef3d7f30a50a5560e7834b43903");
        });
    }
    installEmulatorPackage(api, tag, abi, verbose) {
        return __awaiter(this, void 0, void 0, function* () {
            let args = "";
            if (!verbose) {
                args += " > /dev/null";
            }
            yield (0, exec_with_result_1.execIgnoreFailure)(`bash -c \\\"${this.androidHome()}/cmdline-tools/bootstrap-version/bin/sdkmanager emulator 'cmdline-tools;latest' platform-tools 'system-images;android-${api};${tag};${abi}'${args}"`);
        });
    }
    installPlatform(api, verbose) {
        return __awaiter(this, void 0, void 0, function* () {
            let args = "";
            if (!verbose) {
                args += " > /dev/null";
            }
            yield (0, exec_with_result_1.execIgnoreFailure)(`bash -c \\\"${this.androidHome()}/cmdline-tools/bootstrap-version/bin/sdkmanager 'platforms;android-${api}'${args}"`);
        });
    }
    createEmulator(name, api, tag, abi, hardwareProfile) {
        return __awaiter(this, void 0, void 0, function* () {
            let additionalOptions = "";
            if (hardwareProfile != null && hardwareProfile != "") {
                additionalOptions += `--device ${hardwareProfile}`;
            }
            yield (0, exec_with_result_1.execIgnoreFailure)(`bash -c \\\"echo -n no | ${this.androidHome()}/cmdline-tools/bootstrap-version/bin/avdmanager create avd -n ${name} --package \\\"system-images;android-${api};${tag};${abi}\\\" --tag ${tag}\" ${additionalOptions}`);
            return new emulator_1.Emulator(this, name, api, abi, tag, this.portCounter++, this.portCounter++);
        });
    }
    verifyHardwareAcceleration() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let exitCode = yield (0, exec_1.exec)(`${this.emulatorCmd()} -accel-check`);
                return exitCode == 0;
            }
            catch (e) {
                return false;
            }
        });
    }
    listEmulators() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, exec_with_result_1.execIgnoreFailure)(`${this.emulatorCmd()} -list-avds`);
        });
    }
    listRunningEmulators() {
        return __awaiter(this, void 0, void 0, function* () {
            let output = yield (0, exec_with_result_1.execIgnoreFailure)(`${this.androidHome()}/platform-tools/adb devices`);
            return yield this.parseDevicesOutput(output);
        });
    }
    parseDevicesOutput(output) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = new Array();
            let lines = output.split(/\r?\n/);
            for (let line in lines) {
                if (line.startsWith("emulator")) {
                    let split = line.split(" ");
                    let serial = split[0];
                    let port = serial.split("-")[1];
                    let nameOutput = yield (0, exec_with_result_1.execIgnoreFailure)(`${this.androidHome()}/platform-tools/adb adb -s ${serial} emu avd name`);
                    let nameLines = nameOutput.split(/\r?\n/);
                    let name = nameLines[0];
                    result.fill(new emulator_1.Emulator(this, name, "", "", "", parseInt(port), parseInt(port) + 1));
                }
            }
            return result;
        });
    }
    startAdbServer() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, exec_with_result_1.execIgnoreFailure)(`${this.androidHome()}/platform-tools/adb start-server`);
        });
    }
}
exports.BaseAndroidSdk = BaseAndroidSdk;
class LinuxAndroidSdk extends BaseAndroidSdk {
    constructor() {
        super(...arguments);
        this.defaultSdkUrl = "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip";
    }
}
class MacOSAndroidSdk extends BaseAndroidSdk {
    constructor() {
        super(...arguments);
        this.defaultSdkUrl = "https://dl.google.com/android/repository/commandlinetools-mac-11076708_latest.zip";
    }
}
class SdkFactory {
    getAndroidSdk() {
        switch (process.platform) {
            case "linux":
                return new LinuxAndroidSdk();
            case "darwin":
                return new MacOSAndroidSdk();
            default:
                throw new Error("Unsupported OS");
        }
    }
}
exports.SdkFactory = SdkFactory;
function writeLicenseFile(file, content) {
    return __awaiter(this, void 0, void 0, function* () {
        yield writeFileAsync(file, content);
    });
}
