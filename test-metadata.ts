// Test script to demonstrate metadata functionality
// This shows how LLMs can use the MCP server to add metadata to OpenKM documents

const testMetadata = async () => {
  console.log("OpenKM Metadata Test Examples");
  console.log("=============================\n");
  
  // Example 1: Add keywords to a document
  console.log("1. Adding keywords to a document:");
  console.log("   Tool: add_keyword");
  console.log("   Parameters:");
  console.log('   - nodeId: "/okm:root/document.pdf" (or UUID)');
  console.log('   - keyword: "important"');
  console.log("");

  // Example 2: Remove keywords
  console.log("2. Removing keywords from a document:");
  console.log("   Tool: remove_keyword");
  console.log("   Parameters:");
  console.log('   - nodeId: "/okm:root/document.pdf"');
  console.log('   - keyword: "obsolete"');
  console.log("");

  // Example 3: Add categories
  console.log("3. Adding categories to organize documents:");
  console.log("   Tool: add_category");
  console.log("   Parameters:");
  console.log('   - nodeId: "/okm:root/contract.pdf"');
  console.log('   - catId: "/okm:categories/contracts/legal"');
  console.log("");

  // Example 4: Add property groups for custom metadata
  console.log("4. Adding property groups for custom metadata:");
  console.log("   Tool: add_property_group");
  console.log("   Parameters:");
  console.log('   - nodeId: "/okm:root/technical-doc.pdf"');
  console.log('   - grpName: "okg:technology"');
  console.log("");

  // Example 5: Set property group values
  console.log("5. Setting values in a property group:");
  console.log("   Tool: set_property_group");
  console.log("   Parameters:");
  console.log('   - nodeId: "/okm:root/technical-doc.pdf"');
  console.log('   - grpName: "okg:technology"');
  console.log("   - properties: {");
  console.log('       "okp:technology.type": "manual",');
  console.log('       "okp:technology.language": "English",');
  console.log('       "okp:technology.description": "User manual for product X"');
  console.log("     }");
  console.log("");

  console.log("Available MCP Tools for Metadata:");
  console.log("- add_keyword: Add keywords for search and categorization");
  console.log("- remove_keyword: Remove unwanted keywords");
  console.log("- add_category: Organize documents in hierarchical categories");
  console.log("- add_property_group: Add custom metadata groups");
  console.log("- set_property_group: Set values for custom metadata fields");
  console.log("- get_metadata: Retrieve all metadata for a document");
};

testMetadata();