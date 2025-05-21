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

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB Configuration
MDB_DB_URI=mongodb+srv://your-connection-string
MDB_DB_NAME=your_database_name
MDB_DB_READONLY=false
MDB_DB_TIMEOUT_MS=30000

# Application Configuration
NODE_ENV=development
PORT=3000 
```

### Environment Variables Explained

- `MDB_DB_URI`: Your MongoDB connection string (required)
- `MDB_DB_NAME`: Name of your MongoDB database (default: "sample_mflix")
- `MDB_DB_READONLY`: Set to "true" for read-only mode (default: false)
- `MDB_DB_TIMEOUT_MS`: Connection timeout in milliseconds (default: 30000)
- `NODE_ENV`: Application environment (development/production)
- `PORT`: Server port number (default: 3000)

## Usage

### Using the MCP 

Run the following command in the root of the  folder 
```bash
npm run build
```

### Setting up MCP in VScode

Add the following object in your user settings json in VS CODE 

```json
   "mcp": {
        "servers": {
            "rex-admin": {
                "type": "stdio",
                "command": "node",
                "args": ["YOUR_FILE_PATH/react-admin-mcp/dist/index.js"]
            }
        }
    },
```

 `Note: Update the object json keys as per Claude , to use the MCP with Claude Desktop ` 

 
### Example Prompt

Here's an example of how to use the MCP tools to create a complete React Admin application:

```text

   "Analyze the MongoDB schema for react-admin application. Please provide a detailed architecture analysis. Based on the schema analysis, create a modern UX design for admin panel using the prompt from UX Designer tool. Use a clean, professional color scheme with blue as primary color. Include a dashboard with muiltiple analytical sections. Use the React Admin prompt tool to get details on the strtucture and pages of the react-admin app"
```

### Available MCP Tools

1. **analyzeSchema**
   - Analyzes MongoDB schemas to generate architecture recommendations
   - Provides detailed component structure analysis
   - Identifies relationships between components
   - Suggests security requirements
   - Returns comprehensive architecture analysis including:
     - Component types and relationships
     - Data flow patterns
     - Security recommendations

2. **generateUXDesignPrompt**
   - Generates UX designs based on architecture and requirements
   - Supports custom design systems with:
     - Color schemes
     - Typography
     - Spacing
     - Component styles
   - Creates responsive layouts
   - Generates navigation structures
   - Example usage:
   ```typescript
   {
     designSystem: {
       colors: {
         primary: "#1976d2",
         secondary: "#dc004e",
         accent: "#ff4081",
         background: "#f5f5f5",
         text: "#333333"
       },
       typography: {
         fontFamily: "Roboto, sans-serif",
         headingSizes: {
           h1: "2.5rem",
           h2: "2rem",
           h3: "1.75rem"
         },
         bodySize: "1rem"
       }
     },
     pages: [{
       name: "Dashboard",
       layout: {
         type: "grid",
         columns: 2
       }
     }]
   }
   ```

3. **generateReactAdminPrompt**
   - Generates React Admin components with various configurations
   - Supports multiple component types:
     - List
     - Create
     - Edit
     - Show
   - Handles field validation
   - Supports references and relationships
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

## Project Structure

```
react-admin-mcp/
├── src/
│   ├── config/           # Configuration files
│   │   └── database.ts   # Database configuration
│   │   └── mcp/         # MCP server implementation
│   │       ├── server.ts
│   │       └── tools/   # MCP tools
│   │       └── index.ts         # Application entry point
│   └── .env                 # Environment variables
├── package.json
└── tsconfig.json
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.