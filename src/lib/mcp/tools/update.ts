import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { UpdateObjectParams } from '../../../types/index.js';
import { getDatabase } from '../../../config/database.js';
import { ObjectId } from 'mongodb';

export function registerUpdateTool(server: McpServer) {
  server.tool(
    "updateObject",
    `Updates a specific MongoDB document by its _id in a given collection.`,
    UpdateObjectParams.shape,
    async ({ collection, id, updates }) => {
      const db = await getDatabase();
      const result = await db
        .collection(collection)
        .findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: updates },
          { returnDocument: "after" }
        );

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
} 