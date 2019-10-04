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
const exec_1 = require("@actions/exec");
function execWithResult(commandLine, args, options) {
    return __awaiter(this, void 0, void 0, function* () {
        let result = '';
        yield exec_1.exec(commandLine, args, Object.assign(Object.assign({}, options), { listeners: {
                stdout: (data) => {
                    result += data.toString();
                }
            } }));
        return result.trim();
    });
}
exports.default = execWithResult;
