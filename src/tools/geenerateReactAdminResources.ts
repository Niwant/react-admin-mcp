export function generateReactAdminResource(collection: string, fields: Record<string, string>) {
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
  
    return { resourceCode: code };
  }
  