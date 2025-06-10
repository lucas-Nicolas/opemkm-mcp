#!/usr/bin/env node
/* --------------------------------------------------------------------- *
 | OpenKM Filesystem MCP                                                 |
 |  – navigate the OpenKM repository and read PDFs as plain text         |
 * --------------------------------------------------------------------- */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema, ToolSchema, } from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
/* ---------- 1.  Environment & helper -------------------------------- */
const { OKM_BASE_URL = "http://localhost:9090/OpenKM", OKM_USER = "okmAdmin", OKM_PASS = "admin", } = process.env;
function okmHeaders(overrideHeaders = {}) {
    const auth = Buffer.from(`${OKM_USER}:${OKM_PASS}`).toString("base64");
    return {
        Authorization: `Basic ${auth}`,
        Accept: "application/json", // Default Accept header
        ...overrideHeaders
    };
}
async function okmGet(path, qs = {}, overrideHeaders = {}) {
    const url = new URL(`${OKM_BASE_URL}${path}`);
    for (const [k, v] of Object.entries(qs))
        url.searchParams.append(k, v);
    const res = await fetch(url, { headers: okmHeaders(overrideHeaders) });
    if (!res.ok)
        throw new Error(`${res.status} ${res.statusText}`);
    return res;
}
async function okmPut(path, qs = {}, body, overrideHeaders = {}) {
    const url = new URL(`${OKM_BASE_URL}${path}`);
    for (const [k, v] of Object.entries(qs))
        url.searchParams.append(k, v);
    const options = {
        method: 'PUT',
        headers: okmHeaders(overrideHeaders),
    };
    if (body) {
        options.body = body;
        if (typeof body === 'object' && !(body instanceof Buffer)) {
            options.headers['Content-Type'] = 'application/xml';
            options.body = typeof body === 'string' ? body : JSON.stringify(body);
        }
    }
    const res = await fetch(url, options);
    if (!res.ok)
        throw new Error(`${res.status} ${res.statusText}`);
    return res;
}
async function okmPost(path, qs = {}, body, overrideHeaders = {}) {
    const url = new URL(`${OKM_BASE_URL}${path}`);
    for (const [k, v] of Object.entries(qs))
        url.searchParams.append(k, v);
    const options = {
        method: 'POST',
        headers: okmHeaders(overrideHeaders),
    };
    if (body) {
        options.body = body;
        if (typeof body === 'object' && !(body instanceof Buffer)) {
            options.headers['Content-Type'] = 'application/xml';
            options.body = typeof body === 'string' ? body : JSON.stringify(body);
        }
    }
    const res = await fetch(url, options);
    if (!res.ok)
        throw new Error(`${res.status} ${res.statusText}`);
    return res;
}
async function okmDelete(path, qs = {}, overrideHeaders = {}) {
    const url = new URL(`${OKM_BASE_URL}${path}`);
    for (const [k, v] of Object.entries(qs))
        url.searchParams.append(k, v);
    const res = await fetch(url, { method: 'DELETE', headers: okmHeaders(overrideHeaders) });
    if (!res.ok)
        throw new Error(`${res.status} ${res.statusText}`);
    return res;
}
/* ---------- 2.  Zod argument schemas -------------------------------- */
const ListDirArgs = z.object({ path: z.string() });
const ReadFileArgs = z.object({
    docId: z.string().describe("The path of the document, with backslashes removed only forward slashes are allowed"),
    page_range: z.string().default("1-10").describe("OpenKM page syntax e.g. 1,3-5,-1 (Page range to extract from PDF, defaults to 1-10)")
});
const SearchDocsArgs = z.object({
    query: z.string(),
    limit: z.number().int().positive().max(100).default(10)
});
const GetMetaArgs = z.object({
    nodeId: z.string().describe("Document UUID or path to get metadata for")
});
// Metadata-related schemas
const AddKeywordArgs = z.object({
    nodeId: z.string().describe("Document UUID or path"),
    keyword: z.string().describe("Keyword to add")
});
const RemoveKeywordArgs = z.object({
    nodeId: z.string().describe("Document UUID or path"),
    keyword: z.string().describe("Keyword to remove")
});
const AddCategoryArgs = z.object({
    nodeId: z.string().describe("Document UUID or path"),
    catId: z.string().describe("Category UUID or path (e.g., /okm:categories/contracts)")
});
const AddPropertyGroupArgs = z.object({
    nodeId: z.string().describe("Document UUID or path"),
    grpName: z.string().describe("Property group name (e.g., okg:technology)")
});
const SetPropertyGroupArgs = z.object({
    nodeId: z.string().describe("Document UUID or path"),
    grpName: z.string().describe("Property group name"),
    properties: z.record(z.string(), z.any()).describe("Properties as key-value pairs")
});
const ToolInputSchema = ToolSchema.shape.inputSchema;
/* ---------- 3.  MCP server instance --------------------------------- */
const server = new Server({ name: "openkm-filesystem", version: "1.0.0" }, { capabilities: { tools: {} } });
/* ---------- 4.  List‑tools handler (metadata) ----------------------- */
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "list_directory",
            description: "List immediate children (files & folders) under an OpenKM repository path. "
                + "Each item includes `name`, full `path`, and `isFolder`.",
            inputSchema: zodToJsonSchema(ListDirArgs),
        },
        {
            name: "read_file",
            description: "Return the document contents of `docId`. "
                + "• If it’s a PDF, this server attempts to extract and return its UTF‑8 text content. " // Updated description
                + "• If it’s other text, returns that text. "
                + "• Else returns Base‑64 (with MIME type).",
            inputSchema: zodToJsonSchema(ReadFileArgs),
        },
        {
            name: "search_documents",
            description: "Full‑text search across OpenKM. Returns up to `limit` hits with `path`, "
                + "`docId`, and a short `excerpt` highlighting the match.",
            inputSchema: zodToJsonSchema(SearchDocsArgs),
        },
        {
            name: "get_metadata",
            description: "Retrieve metadata (size, author, created, modified, keywords, categories, etc.) for "
                + "a document using its UUID or path.",
            inputSchema: zodToJsonSchema(GetMetaArgs),
        },
        {
            name: "add_keyword",
            description: "Add a keyword to a document. Keywords help categorize and search for documents.",
            inputSchema: zodToJsonSchema(AddKeywordArgs),
        },
        {
            name: "remove_keyword",
            description: "Remove a keyword from a document.",
            inputSchema: zodToJsonSchema(RemoveKeywordArgs),
        },
        {
            name: "add_category",
            description: "Add a category to a document. Categories provide hierarchical organization.",
            inputSchema: zodToJsonSchema(AddCategoryArgs),
        },
        {
            name: "add_property_group",
            description: "Add a property group to a document. Property groups contain custom metadata fields.",
            inputSchema: zodToJsonSchema(AddPropertyGroupArgs),
        },
        {
            name: "set_property_group",
            description: "Set values for properties in an existing property group on a document.",
            inputSchema: zodToJsonSchema(SetPropertyGroupArgs),
        },
    ],
}));
/* ---------- 5.  Call‑tool handler ----------------------------------- */
server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    try {
        /* ---- list_directory ------------------------------------------- */
        if (name === "list_directory") {
            const { path } = ListDirArgs.parse(args);
            const res = await okmGet("/services/rest/document/getChildren", {
                fldId: path,
            });
            const items = await res.json();
            const listing = items.map((it) => ({
                name: it.title,
                path: it.path,
                isFolder: it.folder,
            }));
            return { content: [{ type: "json", json: listing }] };
        }
        /* ---- read_file ------------------------------------------------ */
        if (name === "read_file") {
            const { docId, page_range } = ReadFileArgs.parse(args);
            // 1) Get the document content.
            const fileResponse = await okmGet("/services/rest/document/getContent", {
                docId: docId,
            }, { Accept: "application/octet-stream" });
            const fileMimeType = fileResponse.headers.get("content-type")?.split(';')[0].trim() ?? "application/octet-stream";
            const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
            if (fileMimeType.startsWith("text/")) {
                return { content: [{ type: "text", text: fileBuffer.toString("utf8") }] };
            }
            else {
                try {
                    const text = await extractText(fileBuffer, page_range);
                    return { content: [{ type: "text", text: text, mimeType: fileMimeType }] };
                }
                catch (pdfError) {
                    const errorMessage = pdfError instanceof Error ? pdfError.message : String(pdfError);
                    console.error(`Error parsing PDF (docId: ${docId}):`, errorMessage);
                    return {
                        content: [{
                                type: "text",
                                text: `Error extracting text from PDF (docId: ${docId}). Details: ${errorMessage}`,
                            }],
                        isError: true,
                    };
                }
            }
        }
        if (name === "search_documents") {
            const { query, limit } = SearchDocsArgs.parse(args);
            // Appel à l’API OKM
            const res = await okmGet("/services/rest/search/findByContent", {
                content: query
            });
            const payload = (await res.json());
            // On slice après coup pour respecter le limit
            const out = (payload.queryResult || [])
                .slice(0, limit)
                .map((hit) => `path: ${hit.node.path}\n` +
                `docId: ${hit.node.uuid}\n` +
                `excerpt: ${hit.excerpt}\n`).join("\n");
            return {
                content: [
                    {
                        type: "text",
                        text: out,
                    }
                ]
            };
        }
        /* ---- get_metadata -------------------------------------------- */
        if (name === "get_metadata") {
            const { nodeId } = GetMetaArgs.parse(args);
            // Try first with docId parameter (for UUIDs), then fallback to docPath for paths
            let res;
            try {
                res = await okmGet("/services/rest/document/getProperties", {
                    docId: nodeId,
                });
            }
            catch (err) {
                // Fallback to path-based lookup
                res = await okmGet("/services/rest/document/getProperties", {
                    docPath: nodeId,
                });
            }
            const meta = await res.json();
            return { content: [{ type: "json", json: meta }] };
        }
        /* ---- add_keyword --------------------------------------------- */
        if (name === "add_keyword") {
            const { nodeId, keyword } = AddKeywordArgs.parse(args);
            await okmPost("/services/rest/property/addKeyword", {
                nodeId: nodeId,
                keyword: keyword,
            });
            return { content: [{ type: "text", text: `Successfully added keyword "${keyword}" to ${nodeId}` }] };
        }
        /* ---- remove_keyword ------------------------------------------ */
        if (name === "remove_keyword") {
            const { nodeId, keyword } = RemoveKeywordArgs.parse(args);
            await okmDelete("/services/rest/property/removeKeyword", {
                nodeId: nodeId,
                keyword: keyword,
            });
            return { content: [{ type: "text", text: `Successfully removed keyword "${keyword}" from ${nodeId}` }] };
        }
        /* ---- add_category -------------------------------------------- */
        if (name === "add_category") {
            const { nodeId, catId } = AddCategoryArgs.parse(args);
            await okmPost("/services/rest/property/addCategory", {
                nodeId: nodeId,
                catId: catId,
            });
            return { content: [{ type: "text", text: `Successfully added category "${catId}" to ${nodeId}` }] };
        }
        /* ---- add_property_group -------------------------------------- */
        if (name === "add_property_group") {
            const { nodeId, grpName } = AddPropertyGroupArgs.parse(args);
            await okmPut("/services/rest/propertyGroup/addGroup", {
                nodeId: nodeId,
                grpName: grpName,
            });
            return { content: [{ type: "text", text: `Successfully added property group "${grpName}" to ${nodeId}` }] };
        }
        /* ---- set_property_group -------------------------------------- */
        if (name === "set_property_group") {
            const { nodeId, grpName, properties } = SetPropertyGroupArgs.parse(args);
            // Convert properties to XML format expected by OpenKM
            const xmlProperties = Object.entries(properties)
                .map(([key, value]) => `<${key}>${value}</${key}>`)
                .join('\n');
            const xmlBody = `<simplePropertiesGroup>
				${xmlProperties}
			</simplePropertiesGroup>`;
            await okmPut("/services/rest/propertyGroup/setPropertiesSimple", {
                nodeId: nodeId,
                grpName: grpName,
            }, xmlBody);
            return { content: [{ type: "text", text: `Successfully set properties for group "${grpName}" on ${nodeId}` }] };
        }
        throw new Error(`Unknown tool: ${name}`);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Error in tool ${name}:`, msg); // Log the error server-side as well
        return {
            content: [{ type: "text", text: `Error: ${msg}` }],
            isError: true,
        };
    }
});
/* ---------- 6.  Helpers         ----------------------------------- */
// Parse a page range string like "1,3-5,-1" into a list of page numbers (1-based)
function parsePageRange(pageRange, numPages) {
    const pages = new Set();
    const parts = pageRange.split(",");
    for (let part of parts) {
        part = part.trim();
        if (!part)
            continue;
        if (part === "-1") {
            pages.add(numPages);
        }
        else if (/^\d+$/.test(part)) {
            const n = parseInt(part, 10);
            if (n >= 1 && n <= numPages)
                pages.add(n);
        }
        else if (/^(\d+)-(\d+)$/.test(part)) {
            const [, startStr, endStr] = part.match(/^(\d+)-(\d+)$/);
            let start = parseInt(startStr, 10);
            let end = parseInt(endStr, 10);
            if (start > end)
                [start, end] = [end, start];
            for (let i = start; i <= end; i++) {
                if (i >= 1 && i <= numPages)
                    pages.add(i);
            }
        }
    }
    // Always sort the result
    return Array.from(pages).filter(p => p >= 1 && p <= numPages).sort((a, b) => a - b);
}
async function extractText(fileBuffer, pageRange) {
    const loadingTask = getDocument(new Uint8Array(fileBuffer));
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const pagesToExtract = parsePageRange(pageRange, numPages);
    if (pagesToExtract.length === 0) {
        return `No valid pages selected (range: "${pageRange}", total pages: ${numPages})`;
    }
    let fullText = "";
    for (const i of pagesToExtract) {
        const page = await pdf.getPage(i);
        const { items } = await page.getTextContent();
        fullText += items.map(i => ('str' in i ? i.str : '')).join('') + '\n\n';
    }
    return fullText;
}
/* ---------- 7.  Boot the server ------------------------------------ */
(async () => {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("OpenKM Filesystem MCP ready (stdio transport)");
})();
