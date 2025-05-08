import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

interface FieldConfig {
  type: string;
  required?: boolean;
  unique?: boolean;
  reference?: string;
}

interface ComponentConfig {
  name: string;
  fields: Record<string, FieldConfig>;
  type: 'list' | 'create' | 'edit' | 'show' | 'all';
}

export function registerGenerateTool(server: McpServer) {
  server.tool(
    "generateReactAdmin",
    "Generate React-Admin components with various configurations",
    {
      name: { type: "string" },
      fields: { 
        type: "object",
        properties: {
          type: { type: "string" },
          required: { type: "boolean", optional: true },
          unique: { type: "boolean", optional: true },
          reference: { type: "string", optional: true }
        }
      },
      type: { 
        type: "string", 
        enum: ['list', 'create', 'edit', 'show', 'all'],
        default: 'all'
      }
    },
    async (args) => {
      const { name, fields, type } = args as ComponentConfig;
      const components = [];
      const imports = new Set<string>();

      // Generate field components based on type
      const fieldComponents = Object.entries(fields).map(([key, config]) => {
        const component = getFieldComponent(key, config);
        imports.add(component.import);
        return component.render;
      });

      // Generate different component types
      if (type === 'all' || type === 'list') {
        components.push(generateListComponent(name, fieldComponents, imports));
      }
      if (type === 'all' || type === 'create') {
        components.push(generateCreateComponent(name, fieldComponents, imports));
      }
      if (type === 'all' || type === 'edit') {
        components.push(generateEditComponent(name, fieldComponents, imports));
      }
      if (type === 'all' || type === 'show') {
        components.push(generateShowComponent(name, fieldComponents, imports));
      }

      const code = `
import { ${Array.from(imports).join(', ')} } from 'react-admin';

${components.join('\n\n')}
`;

      return {
        content: [{ type: "text", text: code }]
      };
    }
  );
}

function getFieldComponent(key: string, config: FieldConfig) {
  const commonProps = `source="${key}" ${config.required ? 'validate={required()}' : ''}`;
  
  switch (config.type) {
    case 'number':
      return {
        import: 'NumberField, NumberInput',
        render: {
          list: `<NumberField ${commonProps} />`,
          form: `<NumberInput ${commonProps} />`
        }
      };
    case 'date':
      return {
        import: 'DateField, DateInput',
        render: {
          list: `<DateField ${commonProps} />`,
          form: `<DateInput ${commonProps} />`
        }
      };
    case 'boolean':
      return {
        import: 'BooleanField, BooleanInput',
        render: {
          list: `<BooleanField ${commonProps} />`,
          form: `<BooleanInput ${commonProps} />`
        }
      };
    case 'reference':
      return {
        import: 'ReferenceField, ReferenceInput, SelectInput',
        render: {
          list: `<ReferenceField ${commonProps} reference="${config.reference}"><TextField source="name" /></ReferenceField>`,
          form: `<ReferenceInput ${commonProps} reference="${config.reference}"><SelectInput optionText="name" /></ReferenceInput>`
        }
      };
    default:
      return {
        import: 'TextField, TextInput',
        render: {
          list: `<TextField ${commonProps} />`,
          form: `<TextInput ${commonProps} />`
        }
      };
  }
}

function generateListComponent(name: string, fieldComponents: any[], imports: Set<string>) {
  imports.add('List, Datagrid');
  return `
export const ${name}List = () => (
  <List>
    <Datagrid>
      ${fieldComponents.map(f => f.list).join('\n      ')}
    </Datagrid>
  </List>
);`;
}

function generateCreateComponent(name: string, fieldComponents: any[], imports: Set<string>) {
  imports.add('Create, SimpleForm');
  return `
export const ${name}Create = () => (
  <Create>
    <SimpleForm>
      ${fieldComponents.map(f => f.form).join('\n      ')}
    </SimpleForm>
  </Create>
);`;
}

function generateEditComponent(name: string, fieldComponents: any[], imports: Set<string>) {
  imports.add('Edit, SimpleForm');
  return `
export const ${name}Edit = () => (
  <Edit>
    <SimpleForm>
      ${fieldComponents.map(f => f.form).join('\n      ')}
    </SimpleForm>
  </Edit>
);`;
}

function generateShowComponent(name: string, fieldComponents: any[], imports: Set<string>) {
  imports.add('Show, SimpleShowLayout');
  return `
export const ${name}Show = () => (
  <Show>
    <SimpleShowLayout>
      ${fieldComponents.map(f => f.list).join('\n      ')}
    </SimpleShowLayout>
  </Show>
);`;
} 