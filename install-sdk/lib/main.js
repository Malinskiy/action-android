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
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const sdk_1 = require("./sdk");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let url = core.getInput('url', { required: false });
            if (url == null || url == "") {
                console.log(`Android SDK URL is not set. Using default`);
            }
            let acceptLicense = core.getInput('acceptLicense');
            if (acceptLicense !== "yes") {
                core.setFailed('You can\'t use this unless you accept the Android SDK licenses');
                return;
            }
            console.log("Installing Android Sdk");
            let sdk = new sdk_1.SdkFactory().getAndroidSdk();
            yield sdk.install(url);
            console.log("Accepting Android SDK licenses");
            yield sdk.acceptLicense();
        }
        catch (error) {
            core.setFailed(error.message);
            return;
        }
    });
}
run();
