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
const exec_with_result_1 = __importDefault(require("./exec-with-result"));
const fs = __importStar(require("fs"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const api = core.getInput('api');
            const abi = core.getInput('abi');
            let tag = core.getInput('tag');
            if (tag !== "default" && tag !== "google_apis") {
                console.log(`Unknown tag ${tag}. Using default`);
                tag = 'default';
            }
            console.log(`Starting emulator with API=${api}, TAG=${tag} and ABI=${abi}...`);
            const androidHome = process.env.ANDROID_HOME;
            console.log(`ANDROID_HOME is ${androidHome}`);
            console.log(`PATH is ${process.env.PATH}`);
            const sdkmanager = "${androidHome}/tools/bin/sdkmanager";
            try {
                if (fs.existsSync(sdkmanager)) {
                    let output = exec_with_result_1.default(``, [`system-images;android-${api};${tag};${abi}`, "--verbose"]);
                    console.log(`${output}`);
                }
                else {
                    core.setFailed("sdkmanager binary is missing");
                }
            }
            catch (error) {
                console.error(error);
                core.setFailed(error.message);
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
