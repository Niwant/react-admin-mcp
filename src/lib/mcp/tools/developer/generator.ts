import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Input type definitions
interface Component {
  name: string;
  type: 'Task' | 'User' | 'Generic';
  relationships: string[];
  fields: Record<string, {
    type: string;
    required?: boolean;
    unique?: boolean;
    reference?: string;
  }>;
}

interface ComponentDesign {
  type: string;
  placement: string;
  props: {
    pagination?: boolean;
    filters?: Array<{
      type: string;
      source: string;
    }>;
    actions?: Array<{
      type: string;
      icon: string;
    }>;
  };
}

interface Design {
  layout: {
    components: Array<{
      type: string;
      placement: string;
      props: Record<string, any>;
    }>;
    visualizations: Array<{
      type: string;
      data: string[];
      placement: string;
    }>;
  };
}

interface Architecture {
  components: Component[];
  dataFlow: Array<{
    from: string;
    to: string;
    type: string;
  }>;
}

export function registerGeneratorTool(server: McpServer) {
//   server.tool(
//     "generateReactAdmin",
//     `Generates React Admin components based on architecture and design.
    
//     Input Structure:
//     {
//       architecture: {
//         components: [{
//           name: string,          // Component name (e.g., "User", "Task")
//           type: "Task" | "User" | "Generic",  // Component type
//           relationships: string[], // Related component names
//           fields: {              // Field definitions
//             [fieldName]: {
//               type: string,      // Field type ("string", "number", etc.)
//               required?: boolean, // Is field required?
//               unique?: boolean,  // Is field unique?
//               reference?: string // Reference to another component
//             }
//           }
//         }],
//         dataFlow: [{
//           from: string,         // Source component
//           to: string,           // Target component
//           type: string          // Relationship type
//         }]
//       },
//       design: {
//         layout: {
//           components: [{
//             type: string,       // Component type
//             placement: string,  // Where to place the component
//             props: {            // Component properties
//               pagination?: boolean,
//               filters?: Array<{type: string, source: string}>,
//               actions?: Array<{type: string, icon: string}>
//             }
//           }],
//           visualizations: [{
//             type: string,       // Chart type
//             data: string[],     // Fields to visualize
//             placement: string   // Where to place the visualization
//           }]
//         }
//       }
//     }`,
//     {
//       architecture: z.object({
//         components: z.array(z.object({
//           name: z.string(),
//           type: z.enum(['Task', 'User', 'Generic']),
//           relationships: z.array(z.string()),
//           fields: z.record(z.object({
//             type: z.string(),
//             required: z.boolean().optional(),
//             unique: z.boolean().optional(),
//             reference: z.string().optional()
//           }))
//         })),
//         dataFlow: z.array(z.object({
//           from: z.string(),
//           to: z.string(),
//           type: z.string()
//         }))
//       }),
//       design: z.object({
//         layout: z.object({
//           components: z.array(z.object({
//             type: z.string(),
//             placement: z.string(),
//             props: z.record(z.any())
//           })),
//           visualizations: z.array(z.object({
//             type: z.string(),
//             data: z.array(z.string()),
//             placement: z.string()
//           }))
//         })
//       })
//     },
//     {
//       title: "Generate React Admin Components",
//       readOnlyHint: true
//     },
//     async (args: { architecture: Architecture; design: Design }, extra) => {
//       const { architecture, design } = args;
//       const components = [];
//       const imports = new Set<string>();

//       // Generate components based on architecture and design
//       for (const component of architecture.components) {
//         const componentCode = generateComponent(component, design);
//         components.push(componentCode);
//         addImports(componentCode, imports);
//       }

//       const code = `
// import { ${Array.from(imports).join(', ')} } from 'react-admin';

// ${components.join('\n\n')}
// `;

//       return {
//         content: [
//           {
//             type: "text",
//             text: code
//           }
//         ]
//       };
//     }
//   );

  server.tool(
    "generateReactAdminPrompt",
    `Generates a comprehensive prompt for React Admin component generation based on architecture and design specifications.
    
    Input Structure:
    {
      architecture: {
        components: [{
          name: string,          // Component name (e.g., "User", "Task")
          type: "Task" | "User" | "Generic",  // Component type
          relationships: string[], // Related component names
          fields: {              // Field definitions
            [fieldName]: {
              type: string,      // Field type ("string", "number", etc.)
              required?: boolean, // Is field required?
              unique?: boolean,  // Is field unique?
              reference?: string // Reference to another component
            }
          }
        }],
        dataFlow: [{
          from: string,         // Source component
          to: string,           // Target component
          type: string          // Relationship type
        }]
      },
      design: {
        layout: {
          components: [{
            type: string,       // Component type
            placement: string,  // Where to place the component
            props: {            // Component properties
              pagination?: boolean,
              filters?: Array<{type: string, source: string}>,
              actions?: Array<{type: string, icon: string}>
            }
          }],
          visualizations: [{
            type: string,       // Chart type
            data: string[],     // Fields to visualize
            placement: string   // Where to place the visualization
          }]
        }
      }
    }`,
    {
      architecture: z.object({
        components: z.array(z.object({
          name: z.string(),
          type: z.enum(['Task', 'User', 'Generic']),
          relationships: z.array(z.string()),
          fields: z.record(z.object({
            type: z.string(),
            required: z.boolean().optional(),
            unique: z.boolean().optional(),
            reference: z.string().optional()
          }))
        })),
        dataFlow: z.array(z.object({
          from: z.string(),
          to: z.string(),
          type: z.string()
        }))
      }),
      design: z.object({
        layout: z.object({
          components: z.array(z.object({
            type: z.string(),
            placement: z.string(),
            props: z.record(z.any())
          })),
          visualizations: z.array(z.object({
            type: z.string(),
            data: z.array(z.string()),
            placement: z.string()
          }))
        })
      })
    },
    {
      title: "Generate React Admin Prompt",
      readOnlyHint: true
    },
    async (args: { architecture: Architecture; design: Design }, extra) => {
      const { architecture, design } = args;
      const prompt = generateReactAdminPrompt(architecture, design);

      return {
        content: [
          {
            type: "text",
            text: prompt
          }
        ]
      };
    }
  );
}

function generateComponent(component: any, design: any) {
  const { name, type, relationships } = component;
  const componentDesign = design.layout.components.find((c: { type: string }) => c.type === type);

  return `
export const ${name}List = () => (
  <List
    ${generateProps(componentDesign.props)}
  >
    <Datagrid>
      ${generateFields(component, relationships)}
    </Datagrid>
  </List>
);

export const ${name}Create = () => (
  <Create>
    <SimpleForm>
      ${generateFormFields(component, relationships)}
    </SimpleForm>
  </Create>
);

export const ${name}Edit = () => (
  <Edit>
    <SimpleForm>
      ${generateFormFields(component, relationships)}
    </SimpleForm>
  </Edit>
);

export const ${name}Show = () => (
  <Show>
    <SimpleShowLayout>
      ${generateShowFields(component, relationships)}
    </SimpleShowLayout>
  </Show>
);`;
}

// Helper functions for component generation
function generateProps(props: any) {
  return Object.entries(props || {})
    .map(([key, value]) => `${key}={${JSON.stringify(value)}}`)
    .join('\n    ');
}

function generateFields(component: any, relationships: string[]) {
  return Object.entries(component.fields || {})
    .map(([key, value]) => {
      if (relationships.includes(key)) {
        return `<ReferenceField source="${key}" reference="${key}"><TextField source="name" /></ReferenceField>`;
      }
      return `<TextField source="${key}" />`;
    })
    .join('\n      ');
}

function generateFormFields(component: any, relationships: string[]) {
  return Object.entries(component.fields || {})
    .map(([key, value]) => {
      if (relationships.includes(key)) {
        return `<ReferenceInput source="${key}" reference="${key}"><SelectInput optionText="name" /></ReferenceInput>`;
      }
      return `<TextInput source="${key}" />`;
    })
    .join('\n      ');
}

function generateShowFields(component: any, relationships: string[]) {
  return Object.entries(component.fields || {})
    .map(([key, value]) => {
      if (relationships.includes(key)) {
        return `<ReferenceField source="${key}" reference="${key}"><TextField source="name" /></ReferenceField>`;
      }
      return `<TextField source="${key}" />`;
    })
    .join('\n      ');
}

function addImports(componentCode: string, imports: Set<string>) {
  const requiredImports = [
    'List', 'Datagrid', 'TextField', 'ReferenceField',
    'Create', 'Edit', 'Show', 'SimpleForm', 'SimpleShowLayout',
    'TextInput', 'ReferenceInput', 'SelectInput'
  ];
  requiredImports.forEach(imp => imports.add(imp));
}


function generateReactAdminPrompt(architecture: Architecture, design: Design): string {
  const { components, dataFlow } = architecture;
  const { layout } = design;

  return `
# React Admin Component Generation Prompt

## 1. Component Architecture

### Components Overview
${components.map(comp => `
#### ${comp.name} (${comp.type})
- Fields:
${Object.entries(comp.fields).map(([field, config]) => `  - ${field}: ${config.type}${config.required ? ' (required)' : ''}${config.unique ? ' (unique)' : ''}${config.reference ? ` (references ${config.reference})` : ''}`).join('\n')}
- Relationships: ${comp.relationships.join(', ')}`).join('\n')}

### Data Flow
${dataFlow.map(flow => `- ${flow.from} → ${flow.to} (${flow.type})`).join('\n')}

## 2. Component Design Requirements

### Layout Components
${layout.components.map(comp => `
#### ${comp.type}
- Placement: ${comp.placement}
- Properties:
${Object.entries(comp.props).map(([prop, value]) => `  - ${prop}: ${JSON.stringify(value)}`).join('\n')}`).join('\n')}

### Visualizations
${layout.visualizations.map(viz => `
#### ${viz.type}
- Data Fields: ${viz.data.join(', ')}
- Placement: ${viz.placement}`).join('\n')}

## 3. Implementation Guidelines

### Component Structure
- Each component should implement List, Create, Edit, and Show views
- Use React Admin's built-in components where possible
- Implement custom components for specialized requirements
- Follow React Admin's best practices for data fetching and state management

### Data Management
- Implement proper data fetching and caching strategies
- Handle relationships and references appropriately
- Implement proper validation for required and unique fields
- Add proper error handling and loading states

### UI/UX Requirements
- Follow the specified layout and placement guidelines
- Implement responsive design patterns
- Add proper loading states and error handling
- Ensure accessibility compliance

### Security Considerations
- Implement proper access control based on component types
- Handle sensitive data appropriately
- Add proper validation for all inputs
- Implement proper error handling for security-related issues

## 4. Additional Requirements

### Performance
- Implement proper code splitting
- Optimize data fetching and caching
- Minimize unnecessary re-renders
- Implement proper loading states

### Testing
- Add unit tests for all components
- Implement integration tests for data flow
- Add proper error handling tests
- Test all user interactions

### Documentation
- Add proper JSDoc comments
- Document all props and their types
- Add usage examples
- Document any custom implementations

## 5. Expected Output

The generated components should:
- Follow React Admin's component patterns
- Implement all required views (List, Create, Edit, Show)
- Handle all specified relationships and data flow
- Follow the specified layout and design requirements
- Include proper error handling and loading states
- Be properly documented and tested
`;
} 