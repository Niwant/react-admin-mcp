# React Admin MCP

A Model Context Protocol (MCP) server for React Admin that provides tools for generating and managing React Admin components based on MongoDB schemas.

## Features

- 🔄 Automatic React Admin component generation
- 📊 MongoDB schema inspection
- 🛠️ Multiple component types support (List, Create, Edit, Show)
- 🔌 Real-time MongoDB connection
- 🎯 Type-safe with TypeScript
- 🚀 ESM support

## Prerequisites

- Node.js 16+
- MongoDB instance
- React Admin project

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/react-admin-mcp.git
cd react-admin-mcp

# Install dependencies
npm install
```

## Configuration

Create a `.env` file in the root directory:

```env
MDB_DB_URI=mongodb+srv://your-connection-string
MDB_DB_NAME=your_database_name
MDB_DB_READONLY=false
MDB_DB_TIMEOUT_MS=30000
```

## Usage

### Starting the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### Available MCP Tools

1. **getSchemas**
   - Fetches all MongoDB collection schemas
   - Returns field types and structure

2. **generateReactAdmin**
   - Generates React Admin components
   - Supports multiple component types:
     - List
     - Create
     - Edit
     - Show
   - Example usage:
   ```typescript
   {
     name: "User",
     fields: {
       name: { type: "string", required: true },
       age: { type: "number" },
       email: { type: "string", unique: true },
       role: { type: "reference", reference: "roles" }
     },
     type: "all"
   }
   ```

3. **updateObject**
   - Updates MongoDB documents
   - Supports field validation

4. **getObjects**
   - Retrieves documents from collections
   - Supports filtering

## Project Structure
