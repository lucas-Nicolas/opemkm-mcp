// mock-client.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
async function main() {
    // 1) Spawn your server script as a subprocess over stdio
    const transport = new StdioClientTransport({
        // Adjust the command & args as needed to point to your server entrypoint
        command: "npx",
        args: ["mcp-openkm"],
    });
    // 2) Create and connect the MCP client
    const client = new Client({ name: "openkm-mock-client", version: "1.0.0" });
    await client.connect(transport);
    // 3) List available tools
    const { tools } = await client.listTools();
    console.log("🔧 Available tools:");
    tools.forEach(t => console.log(` • ${t.name}: ${t.description}`));
    // 4) Invoke each tool with example inputs
    try {
        console.log("\n📂 list_directory:");
        const listDir = await client.callTool({
            name: "list_directory",
            arguments: { path: "0" }, // root folder ID in OpenKM
        });
        console.log(JSON.stringify(listDir.content, null, 2));
        console.log("\n📄 read_file:");
        const readFile = await client.callTool({
            name: "read_file",
            arguments: { path: "/okmAdmin/mydoc.pdf", page_range: "1-2" },
        });
        console.log(readFile.content.map((c) => c.text).join("\n"));
        console.log("\n🔍 search_documents:");
        const search = await client.callTool({
            name: "search_documents",
            arguments: { query: "invoice", limit: 5 },
        });
        console.log(JSON.stringify(search.content, null, 2));
        console.log("\n🗂 get_metadata:");
        const meta = await client.callTool({
            name: "get_metadata",
            arguments: { path: "/okmAdmin/mydoc.pdf" },
        });
        console.log(JSON.stringify(meta.content, null, 2));
    }
    catch (err) {
        console.error("Error calling tool:", err);
    }
    process.exit(0);
}
main().catch(err => {
    console.error("Client error:", err);
    process.exit(1);
});
