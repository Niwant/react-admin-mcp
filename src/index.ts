import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { MongoClient  , ObjectId} from "mongodb";

const MONGO_URI = "mongodb+srv://nsalunke:nsal123@niwant.qaqlo.mongodb.net/?retryWrites=true&w=majority&appName=Niwant"
const DB_NAME = "sample_mflix";

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

const updateObjectParams = z.object({
  collection: z.string(),
  id: z.string(),
  updates: z.record(z.any()),
});

const getObjectsParams = z.object({
  collection: z.string(),
  filter: z.record(z.any()).optional(), // Optional filter params
});

// Tool 1: Get MongoDB schemas
server.tool(
  "getSchemas",
  "Fetch all MongoDB collection schemas",
  getSchemasParams.shape,
  async () => {
    const uri = MONGO_URI; // Replace with your MongoDB URI
    if (!uri) {
      throw new Error("MONGO_URI environment variable is not set");
    }
    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db(DB_NAME); // Replace with your database name
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

// Tool 3: Update MongoDB document
server.tool(
  "updateObject",
  `Updates a specific MongoDB document by its _id in a given collection.

🔧 Inputs:
• collection: string – collection name
• id: string – document _id (as ObjectId string)
• updates: { [fieldName: string]: any } – fields to modify

📥 Example Input:
{
  "collection": "users",
  "id": "66380f66d2c27fc52be24611",
  "updates": {
    "status": "active",
    "role": "manager"
  }
}

📤 Output:
The updated document (if found), or an error if not.`,
  updateObjectParams.shape,
  async ({ collection, id, updates }) => {
    const uri = MONGO_URI;
    if (!uri) throw new Error("MONGO_URI is not set");
    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db(DB_NAME); // replace with your DB name
    const result = await db
      .collection(collection)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updates },
        { returnDocument: "after" }
      );

    await client.close();

    if (!result?.value) {
      return {
        content: [{ type: "text", text: `Document not found in ${collection}` }],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `✅ Updated Document:\n` + JSON.stringify(result?.value, null, 2),
        },
      ],
    };
  }
);


// Tool 4: Get MongoDB documents
server.tool(
  "getObjects",
  `Retrieves multiple documents from a specified MongoDB collection. You can optionally apply a basic filter.

🔧 Inputs:
• collection: string – collection name
• filter (optional): { [field: string]: value }

📥 Example Input:
{
  "collection": "users",
  "filter": {
    "status": "active",
    "role": "admin"
  }
}

📤 Output:
Up to 100 documents matching the filter, or all if no filter is provided.`,
  getObjectsParams.shape,
  async ({ collection, filter = {} }) => {
    const uri = MONGO_URI;
    if (!uri) throw new Error("MONGO_URI is not set");
    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db(DB_NAME); // replace with actual DB name
    let documents = [];

    try {
      documents = await db.collection(collection).find(filter).limit(100).toArray(); // Limit for safety
    } catch (err) {
      console.error("❌ Error fetching documents:", err);
      return {
        content: [{ type: "text", text: "❌ Failed to fetch documents." }],
      };
    } finally {
      await client.close();
    }

    if (!documents.length) {
      return {
        content: [{ type: "text", text: `⚠️ No documents found in ${collection}` }],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `📄 Fetched ${documents.length} documents from "${collection}":\n\n` +
                JSON.stringify(documents, null, 2),
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
