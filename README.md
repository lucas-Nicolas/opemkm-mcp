# OpenKM MCP Server

A Model Context Protocol (MCP) server that provides seamless integration with OpenKM document management system. This server enables LLMs to interact with OpenKM repositories, including document navigation, content extraction, search capabilities, and comprehensive metadata management.

## Features

### 📁 Document Management
- **Browse directories**: Navigate through OpenKM folder structures
- **Read documents**: Extract text content from PDFs and other document types
- **Search documents**: Full-text search across your OpenKM repository
- **Get metadata**: Retrieve document properties and metadata

### 🏷️ Metadata Management
- **Keywords**: Add and remove keywords for better document categorization
- **Categories**: Organize documents using hierarchical categories
- **Property Groups**: Create and manage custom metadata fields
- **Custom Properties**: Set values for custom metadata properties

## Installation

### Prerequisites
- Node.js 18 or higher
- Access to an OpenKM server instance
- Valid OpenKM user credentials

### Install from NPM

```bash
npm install -g @oakcrest/mcp-openkm
```

### Install from Source

```bash
git clone https://github.com/lucas-Nicolas/opemkm-mcp.git
cd opemkm-mcp
npm install
npm run build
```

## Configuration

Set the following environment variables:

```bash
export OKM_BASE_URL="http://your-openkm-server:8080/OpenKM"
export OKM_USER="your-username"
export OKM_PASS="your-password"
```

### Default Values
- `OKM_BASE_URL`: `http://localhost:9090/OpenKM`
- `OKM_USER`: `okmAdmin`
- `OKM_PASS`: `admin`

## Usage

### Running the Server

```bash
# Using global installation
mcp-openkm

# Using npx
npx @oakcrest/mcp-openkm

# From source
node dist/server.js
```

## Available Tools

### Document Operations

#### `list_directory`
List immediate children (files & folders) under an OpenKM repository path.

**Parameters:**
- `path` (string): OpenKM repository path

**Example:**
```json
{
  "path": "/okm:root/documents"
}
```

#### `read_file`
Extract text content from documents, with special support for PDFs.

**Parameters:**
- `docId` (string): Document path or UUID
- `page_range` (string, optional): Page range for PDFs (default: "1-10")

**Example:**
```json
{
  "docId": "/okm:root/documents/manual.pdf",
  "page_range": "1,3-5,-1"
}
```

#### `search_documents`
Perform full-text search across OpenKM repository.

**Parameters:**
- `query` (string): Search query
- `limit` (number, optional): Maximum results (default: 10, max: 100)

**Example:**
```json
{
  "query": "contract agreement",
  "limit": 20
}
```

#### `get_metadata`
Retrieve comprehensive metadata for a document or folder.

**Parameters:**
- `path` (string): Document or folder path

**Example:**
```json
{
  "path": "/okm:root/documents/contract.pdf"
}
```

### Metadata Management

#### `add_keyword`
Add a keyword to a document for better categorization and search.

**Parameters:**
- `nodeId` (string): Document UUID or path
- `keyword` (string): Keyword to add

**Example:**
```json
{
  "nodeId": "/okm:root/documents/contract.pdf",
  "keyword": "legal"
}
```

#### `remove_keyword`
Remove a keyword from a document.

**Parameters:**
- `nodeId` (string): Document UUID or path
- `keyword` (string): Keyword to remove

**Example:**
```json
{
  "nodeId": "/okm:root/documents/contract.pdf",
  "keyword": "obsolete"
}
```

#### `add_category`
Add a category to organize documents hierarchically.

**Parameters:**
- `nodeId` (string): Document UUID or path
- `catId` (string): Category UUID or path

**Example:**
```json
{
  "nodeId": "/okm:root/documents/contract.pdf",
  "catId": "/okm:categories/legal/contracts"
}
```

#### `add_property_group`
Add a property group to a document for custom metadata.

**Parameters:**
- `nodeId` (string): Document UUID or path
- `grpName` (string): Property group name

**Example:**
```json
{
  "nodeId": "/okm:root/documents/manual.pdf",
  "grpName": "okg:technology"
}
```

#### `set_property_group`
Set values for properties in an existing property group.

**Parameters:**
- `nodeId` (string): Document UUID or path
- `grpName` (string): Property group name
- `properties` (object): Key-value pairs of properties

**Example:**
```json
{
  "nodeId": "/okm:root/documents/manual.pdf",
  "grpName": "okg:technology",
  "properties": {
    "okp:technology.type": "manual",
    "okp:technology.language": "English",
    "okp:technology.description": "User manual for product X"
  }
}
```

## Integration with MCP Applications

### Claude Desktop

Add the server to your Claude Desktop configuration:

#### macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
#### Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "openkm": {
      "command": "mcp-openkm",
      "env": {
        "OKM_BASE_URL": "http://your-openkm-server:8080/OpenKM",
        "OKM_USER": "your-username",
        "OKM_PASS": "your-password"
      }
    }
  }
}
```

### Other MCP Clients

For other MCP-compatible applications, use the standard MCP protocol to connect:

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "mcp-openkm",
  env: {
    OKM_BASE_URL: "http://your-openkm-server:8080/OpenKM",
    OKM_USER: "your-username",
    OKM_PASS: "your-password"
  }
});

const client = new Client({
  name: "openkm-client",
  version: "1.0.0"
}, {
  capabilities: {}
});

await client.connect(transport);
```

## Example Use Cases

### Document Discovery
```
"List all documents in the contracts folder and show me the metadata for any PDF files"
```

### Content Analysis
```
"Search for documents containing 'privacy policy' and extract the text from the first 3 pages of each result"
```

### Metadata Management
```
"Add the keyword 'confidential' to all documents in the legal folder and categorize them under /okm:categories/legal/confidential"
```

### Custom Properties
```
"For all technical manuals, add the technology property group and set the language to English and type to user-manual"
```

## PDF Page Range Syntax

The `page_range` parameter supports flexible syntax:
- `"1"`: Single page
- `"1,3,5"`: Specific pages
- `"1-5"`: Page range
- `"1,3-5,10"`: Mixed format
- `"-1"`: Last page
- `"1-10"`: First 10 pages (default)

## Error Handling

The server provides detailed error messages for common issues:
- **Authentication failures**: Check your OpenKM credentials
- **Network errors**: Verify OpenKM server URL and connectivity
- **Permission errors**: Ensure user has appropriate OpenKM permissions
- **Document not found**: Verify document paths and existence

## Development

### Building from Source

```bash
git clone https://github.com/lucas-Nicolas/opemkm-mcp.git
cd opemkm-mcp
npm install
npm run build
```

### Running Tests

```bash
npm test
```

### Project Structure

```
mcp-openkm/
├── src/
│   └── server.ts          # Main server implementation
├── dist/                  # Compiled JavaScript
├── types/                 # TypeScript type definitions
├── package.json
├── tsconfig.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/lucas-Nicolas/opemkm-mcp/issues)
- **Documentation**: [OpenKM REST API](https://docs.openkm.com/kcenter/view/okm-6.3-com/restful.html)
- **MCP Protocol**: [Model Context Protocol](https://spec.modelcontextprotocol.io/)

## Changelog

### v1.1.0
- ✨ Added comprehensive metadata management
- ✨ Keyword management (add/remove)
- ✨ Category management
- ✨ Property group management
- ✨ Custom property value setting
- 📝 Enhanced documentation

### v1.0.8
- 🚀 Initial release
- 📁 Document browsing and reading
- 🔍 Full-text search
- 📊 Basic metadata retrieval
- 📄 PDF text extraction with page range support