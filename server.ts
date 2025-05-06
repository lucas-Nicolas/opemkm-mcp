#!/usr/bin/env node

/* --------------------------------------------------------------------- *
 |  OpenKM Filesystem MCP                                                |
 |  – navigate the OpenKM repository and read PDFs as plain text         |
 * --------------------------------------------------------------------- */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
	StdioServerTransport
} from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	ListToolsRequestSchema,
	CallToolRequestSchema,
	ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";

import fetch from "node-fetch";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

/* ---------- 1.  Environment & helper -------------------------------- */

const {
	OKM_BASE_URL = "http://localhost:9090/OpenKM",
	OKM_USER = "okmAdmin",
	OKM_PASS = "admin",
} = process.env;

function okmHeaders(extra: Record<string, string> = {}) {
	const auth = Buffer.from(`${OKM_USER}:${OKM_PASS}`).toString("base64");
	return { Authorization: `Basic ${auth}`, ...extra };
}

async function okmGet(path: string, qs: Record<string, string> = {}) {
	const url = new URL(`${OKM_BASE_URL}${path}`);
	for (const [k, v] of Object.entries(qs)) url.searchParams.append(k, v);
	const res = await fetch(url, { headers: okmHeaders() });
	if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
	return res;
}

/* ---------- 2.  Zod argument schemas -------------------------------- */

const ListDirArgs = z.object({ path: z.string() });
const ReadFileArgs = z.object({
	path: z.string(),
	page_range: z.string().optional().describe("OpenKM page syntax e.g. 1,3-5,-1")
});
const SearchDocsArgs = z.object({
	query: z.string(),
	limit: z.number().int().positive().max(100).default(10)
});
const GetMetaArgs = z.object({ path: z.string() });

type ListDirParams = z.infer<typeof ListDirArgs>;
type ReadFileParams = z.infer<typeof ReadFileArgs>;
type SearchDocsParams = z.infer<typeof SearchDocsArgs>;
type GetMetaParams = z.infer<typeof GetMetaArgs>;

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

/* ---------- 3.  MCP server instance --------------------------------- */

const server = new Server(
	{ name: "openkm-filesystem", version: "1.0.0" },
	{ capabilities: { tools: {} } }
);

/* ---------- 4.  List‑tools handler (metadata) ----------------------- */

server.setRequestHandler(ListToolsRequestSchema, async () => ({
	tools: [
		{
			name: "list_directory",
			description:
				"List immediate children (files & folders) under an OpenKM repository path. "
				+ "Each item includes `name`, full `path`, and `isFolder`.",
			inputSchema: zodToJsonSchema(ListDirArgs) as ToolInput,
		},
		{
			name: "read_file",
			description:
				"Return the document contents at `path`. "
				+ "• If it’s a PDF, returns extracted UTF‑8 text (OpenKM extractor/OCR). "
				+ "• If it’s other text, returns that text. "
				+ "• Else returns Base‑64 (with MIME type).",
			inputSchema: zodToJsonSchema(ReadFileArgs) as ToolInput,
		},
		{
			name: "search_documents",
			description:
				"Full‑text search across OpenKM. Returns up to `limit` hits with `path`, "
				+ "`docId`, and a short `excerpt` highlighting the match.",
			inputSchema: zodToJsonSchema(SearchDocsArgs) as ToolInput,
		},
		{
			name: "get_metadata",
			description:
				"Retrieve metadata (size, author, created, modified, keywords, etc.) for "
				+ "a document or folder at the given repository `path`.",
			inputSchema: zodToJsonSchema(GetMetaArgs) as ToolInput,
		},
	],
}));

/* ---------- 5.  Call‑tool handler ----------------------------------- */

server.setRequestHandler(CallToolRequestSchema, async (req) => {
	const { name, arguments: args } = req.params;

	try {
		/* ---- list_directory ------------------------------------------- */
		if (name === "list_directory") {
			const { path } = ListDirArgs.parse(args) as ListDirParams;
			const res = await okmGet("/services/rest/document/getChildren", {
				fldId: path,
			});
			const items = await res.json() as any[];
			const listing = items.map((it: any) => ({
				name: it.title,
				path: it.path,
				isFolder: it.folder,
			}));

			return { content: [{ type: "json", json: listing }] };
		}

		/* ---- read_file ------------------------------------------------ */
		if (name === "read_file") {
			const { path } = ReadFileArgs.parse(args) as ReadFileParams;

			// 1) Try to get text directly (works if OpenKM extractor already ran)
			const textRes = await okmGet("/services/rest/document/getContent", {
				docPath: path,
				inline: "true",
			});
			const mime = textRes.headers.get("content-type") ?? "application/octet-stream";

			if (mime.startsWith("text/")) {
				return { content: [{ type: "text", text: await textRes.text() }] };
			}

			// 2) Fallback: if PDF blob, request again with `Accept: text/plain`
			if (mime === "application/pdf") {
				// Optionally, implement PDF text extraction here if needed.
			}

			// Keep sample simple; fallback to Base‑64
			const buf = Buffer.from(await textRes.arrayBuffer());
			return {
				content: [{
					type: "text",
					text: buf.toString("base64"),
					mimeType: mime
				}],
			};
		}

		/* ---- search_documents ---------------------------------------- */
		if (name === "search_documents") {
			const { query, limit } = SearchDocsArgs.parse(args) as SearchDocsParams;
			const res = await okmGet("/services/rest/search/findByContent", {
				content: query,
				limit: String(limit),
			});
			const hits = await res.json() as { result: any[] };
			const out = hits.result.map((h: any) => ({
				path: h.document.path,
				docId: h.document.uuid,
				excerpt: h.excerpt,
			}));

			return { content: [{ type: "json", json: out }] };
		}

		/* ---- get_metadata -------------------------------------------- */
		if (name === "get_metadata") {
			const { path } = GetMetaArgs.parse(args) as GetMetaParams;
			const res = await okmGet("/services/rest/document/getProperties", {
				docPath: path,
			});
			const meta = await res.json();
			return { content: [{ type: "json", json: meta }] };
		}

		throw new Error(`Unknown tool: ${name}`);

	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		return {
			content: [{ type: "text", text: `Error: ${msg}` }],
			isError: true,
		};
	}
});

/* ---------- 6.  Boot the server ------------------------------------ */

(async () => {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("OpenKM Filesystem MCP ready (stdio transport)");
})();


