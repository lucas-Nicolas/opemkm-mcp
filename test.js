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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// mock-client.ts
var index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
var stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var transport, client, tools, listDir, readFile, search, meta, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    transport = new stdio_js_1.StdioClientTransport({
                        // Adjust the command & args as needed to point to your server entrypoint
                        command: "npx",
                        args: ["mcp-openkm"],
                    });
                    client = new index_js_1.Client({ name: "openkm-mock-client", version: "1.0.0" });
                    return [4 /*yield*/, client.connect(transport)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, client.listTools()];
                case 2:
                    tools = (_a.sent()).tools;
                    console.log("🔧 Available tools:");
                    tools.forEach(function (t) { return console.log(" \u2022 ".concat(t.name, ": ").concat(t.description)); });
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 8, , 9]);
                    console.log("\n📂 list_directory:");
                    return [4 /*yield*/, client.callTool({
                            name: "list_directory",
                            arguments: { path: "0" }, // root folder ID in OpenKM
                        })];
                case 4:
                    listDir = _a.sent();
                    console.log(JSON.stringify(listDir.content, null, 2));
                    console.log("\n📄 read_file:");
                    return [4 /*yield*/, client.callTool({
                            name: "read_file",
                            arguments: { path: "/okmAdmin/mydoc.pdf", page_range: "1-2" },
                        })];
                case 5:
                    readFile = _a.sent();
                    console.log(readFile.content.map(function (c) { return c.text; }).join("\n"));
                    console.log("\n🔍 search_documents:");
                    return [4 /*yield*/, client.callTool({
                            name: "search_documents",
                            arguments: { query: "invoice", limit: 5 },
                        })];
                case 6:
                    search = _a.sent();
                    console.log(JSON.stringify(search.content, null, 2));
                    console.log("\n🗂 get_metadata:");
                    return [4 /*yield*/, client.callTool({
                            name: "get_metadata",
                            arguments: { path: "/okmAdmin/mydoc.pdf" },
                        })];
                case 7:
                    meta = _a.sent();
                    console.log(JSON.stringify(meta.content, null, 2));
                    return [3 /*break*/, 9];
                case 8:
                    err_1 = _a.sent();
                    console.error("Error calling tool:", err_1);
                    return [3 /*break*/, 9];
                case 9:
                    process.exit(0);
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (err) {
    console.error("Client error:", err);
    process.exit(1);
});
