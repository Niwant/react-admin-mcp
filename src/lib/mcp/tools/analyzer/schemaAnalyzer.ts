import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getDatabase } from '../../../../config/database.js';

interface SchemaAnalysis {
  architecture: {
    components: Array<{
      name: string;
      type: string;
      relationships: string[];
      security: string[];
      fields: Array<{
        name: string;
        type: string;
        required?: boolean;
        unique?: boolean;
        reference?: string;
        validation?: {
          min?: number;
          max?: number;
          pattern?: string;
          enum?: string[];
        };
      }>;
    }>;
    dataFlow: Array<{
      from: string;
      to: string;
      type: string;
    }>;
    security: Array<{
      component: string;
      access: string[];
    }>;
  };
}

interface FieldAnalysis {
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  reference?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
}

export function registerSchemaAnalyzerTool(server: McpServer) {
  server.tool(
    "analyzeSchema",
    "Analyzes MongoDB schemas to generate architecture recommendations",
    {},
    async () => {
      const db = await getDatabase();
      const collections = await db.listCollections().toArray();
      
      const analysis: SchemaAnalysis = {
        architecture: {
          components: [],
          dataFlow: [],
          security: []
        }
      };

      // Analyze each collection
      for (const coll of collections) {
        try {
          const sample = await db.collection(coll.name).findOne();
          if (sample) {
            // Analyze component structure
            const component = {
              name: coll.name,
              type: determineComponentType(sample),
              relationships: findRelationships(sample),
              security: determineSecurityNeeds(sample),
              fields: analyzeFields(sample)
            };
            analysis.architecture.components.push(component);

            // Analyze data flow
            const dataFlow = analyzeDataFlow(sample, coll.name);
            analysis.architecture.dataFlow.push(...dataFlow);

            // Add security recommendations
            analysis.architecture.security.push({
              component: coll.name,
              access: determineAccessLevels(sample)
            });
          }
        } catch (err) {
          console.error(`Error analyzing ${coll.name}:`, err);
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(analysis, null, 2)
          }
        ]
      };
    }
  );
}

function determineComponentType(sample: any): string {
  // Logic to determine if it's a list, detail, or complex component
  const fields = Object.keys(sample);
  if (fields.includes('status') && fields.includes('priority')) return 'Task';
  if (fields.includes('email') && fields.includes('role')) return 'User';
  return 'Generic';
}

function findRelationships(sample: any): string[] {
  const relationships = [];
  for (const [key, value] of Object.entries(sample)) {
    if (typeof value === 'object' && value !== null) {
      relationships.push(key);
    }
  }
  return relationships;
}

function determineSecurityNeeds(sample: any): string[] {
  const security = [];
  if (Object.keys(sample).includes('password')) security.push('encryption');
  if (Object.keys(sample).includes('role')) security.push('authorization');
  return security;
}

function analyzeDataFlow(sample: any, collectionName: string): Array<{from: string, to: string, type: string}> {
  const dataFlow = [];
  for (const [key, value] of Object.entries(sample)) {
    if (typeof value === 'object' && value !== null) {
      dataFlow.push({
        from: collectionName,
        to: key,
        type: 'reference'
      });
    }
  }
  return dataFlow;
}

function determineAccessLevels(sample: any): string[] {
  const access = ['read'];
  if (!Object.keys(sample).includes('system')) {
    access.push('create', 'update', 'delete');
  }
  return access;
}

function analyzeFields(sample: any): FieldAnalysis[] {
  const fields: FieldAnalysis[] = [];
  for (const [key, value] of Object.entries(sample)) {
    const field: FieldAnalysis = {
      name: key,
      type: typeof value,
      required: true, // Default to required since we found it in the sample
      unique: false,
      reference: undefined,
      validation: undefined
    };

    // Determine if it's a reference field
    if (typeof value === 'object' && value !== null && '_id' in value) {
      field.type = 'reference';
      field.reference = (value as { _id: any })._id.toString();
    }

    // Add validation rules based on field type and name
    if (typeof value === 'number') {
      field.validation = {
        min: 0,
        max: value > 100 ? 100 : undefined
      };
    } else if (typeof value === 'string') {
      if (key.includes('email')) {
        field.validation = {
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        };
      } else if (key.includes('password')) {
        field.validation = {
          pattern: '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$'
        };
      }
    }

    // Determine if field should be unique
    if (key === 'email' || key === 'username' || key.includes('code')) {
      field.unique = true;
    }

    fields.push(field);
  }
  return fields;
} 