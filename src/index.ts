import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { MongoClient } from "mongodb";

// Create MCP server instance
const server = new McpServer({
  name: "admin-mcp",
  version: "1.0.0",
  capabilities: {
    tools: {},
    resources: {},
  },
});

// Define Zod schemas (and extract raw shape)
const getSchemasParams = z.object({});

const generateParams = z.object({
  collection: z.string(),
  fields: z.record(z.string(), z.string()),
});

// Tool 1: Get MongoDB schemas
server.tool(
  "getSchemas",
  "Fetch all MongoDB collection schemas",
  getSchemasParams.shape,
  async () => {
    const uri = "YOUR_MONGO_URI"; // Replace with your MongoDB URI
    if (!uri) {
      throw new Error("MONGO_URI environment variable is not set");
    }
    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db("YOUR_DB_NAME"); // Replace with your database name
    const collections = await db.listCollections().toArray();

// const filteredCollections = collections.filter(c => !c.name.startsWith("system."));
console.log("Collections:", collections.map(c => c.name));
const schemaInfo = [];
for (const coll of collections) {
  try {
    const sample = await db.collection(coll.name).findOne();
    if (sample) {
      schemaInfo.push({
        name: coll.name,
        fields: Object.fromEntries(
          Object.entries(sample).map(([k, v]) => [k, typeof v])
        ),
      });
    }
  } catch (err) {
    console.error(`Skipping ${coll.name} due to read error:`, err);
  }
}
console.log("Schema info:", schemaInfo);
    await client.close();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(schemaInfo, null, 2),
        },
      ],
    };
  }
);

// Tool 2: Generate React-Admin resource
server.tool(
  "generateReactAdmin",
  "Generate React-Admin resource code",
  generateParams.shape,
  async ({ collection, fields }: { collection: string; fields: Record<string, string> }) => {
    const fieldComponents = Object.entries(fields).map(([key, type]) => {
      const component = type === "number" ? "NumberField" : "TextField";
      return `<${component} source="${key}" />`;
    });

    const code = `
import { List, Datagrid, ${[...new Set(fieldComponents.map(f => f.match(/<(\w+)/)![1]))].join(', ')} } from 'react-admin';

export const ${collection}List = () => (
  <List>
    <Datagrid>
      ${fieldComponents.join("\n      ")}
    </Datagrid>
  </List>
);`;

    return {
      content: [
        {
          type: "text",
          text: code,
        },
      ],
    };
  }
);

// Start server using stdio
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ Admin MCP Server running via stdio");
}

main().catch((error) => {
  console.error("❌ Fatal error in MCP server:", error);
  process.exit(1);
});
