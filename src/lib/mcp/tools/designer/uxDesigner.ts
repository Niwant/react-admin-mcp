import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Input type definitions
interface DesignSystem {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    fontFamily: string;
    headingSizes: Record<string, string>;
    bodySize: string;
  };
  spacing: {
    unit: string;
    scale: number[];
  };
  components: {
    [key: string]: {
      style: Record<string, string>;
      variants?: Record<string, Record<string, string>>;
    };
  };
}

interface LayoutConfig {
  type: 'grid' | 'flex' | 'stack';
  direction?: 'row' | 'column';
  gap?: string;
  columns?: number;
}

interface ComponentDesign {
  type: string;
  name: string;
  layout: LayoutConfig;
  style: Record<string, string>;
  children?: ComponentDesign[];
  props?: Record<string, any>;
}

interface PageDesign {
  name: string;
  layout: LayoutConfig;
  components: ComponentDesign[];
  navigation?: {
    position: 'top' | 'side';
    items: Array<{
      label: string;
      path: string;
      icon?: string;
    }>;
  };
}

interface SchemaAnalysis {
  architecture: {
    components: Array<{
      name: string;
      type: string;
      relationships: string[];
      security: string[];
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

// Zod schema for input validation
const layoutConfigSchema = z.object({
  type: z.enum(['grid', 'flex', 'stack']),
  direction: z.enum(['row', 'column']).optional(),
  gap: z.string().optional(),
  columns: z.number().optional()
});

type ComponentDesignSchema = z.ZodType<ComponentDesign>;

const componentDesignSchema: ComponentDesignSchema = z.object({
  type: z.string(),
  name: z.string(),
  layout: layoutConfigSchema,
  style: z.record(z.string()),
  children: z.array(z.lazy(() => componentDesignSchema)).optional(),
  props: z.record(z.any()).optional()
});

const designSystemSchema = z.object({
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    text: z.string()
  }),
  typography: z.object({
    fontFamily: z.string(),
    headingSizes: z.record(z.string()),
    bodySize: z.string()
  }),
  spacing: z.object({
    unit: z.string(),
    scale: z.array(z.number())
  }),
  components: z.record(z.object({
    style: z.record(z.string()),
    variants: z.record(z.record(z.string())).optional()
  }))
});

const pageDesignSchema = z.object({
  name: z.string(),
  layout: layoutConfigSchema,
  components: z.array(componentDesignSchema),
  navigation: z.object({
    position: z.enum(['top', 'side']),
    items: z.array(z.object({
      label: z.string(),
      path: z.string(),
      icon: z.string().optional()
    }))
  }).optional()
});

export function registerUxDesignerTool(server: McpServer) {
  server.tool(
    "generateDesign",
    `Generates UX designs based on architecture and requirements.
    
    Input Structure:
    {
      designSystem: {
        colors: {
          primary: string,    // Primary brand color (e.g., "#1976d2")
          secondary: string,  // Secondary brand color (e.g., "#dc004e")
          accent: string,     // Accent color for highlights (e.g., "#ff4081")
          background: string, // Background color (e.g., "#f5f5f5")
          text: string       // Main text color (e.g., "#333333")
        },
        typography: {
          fontFamily: string,  // Main font family (e.g., "Roboto, sans-serif")
          headingSizes: {      // Heading sizes
            h1: string,        // e.g., "2.5rem"
            h2: string,        // e.g., "2rem"
            h3: string         // e.g., "1.75rem"
          },
          bodySize: string     // Body text size (e.g., "1rem")
        },
        spacing: {
          unit: string,        // Base spacing unit (e.g., "8px")
          scale: number[]      // Spacing scale multipliers (e.g., [0, 1, 2, 3, 4, 5])
        },
        components: {
          [componentName]: {   // Component-specific styles
            style: {           // Base styles
              [property: string]: string
            },
            variants?: {       // Optional component variants
              [variantName: string]: {
                [property: string]: string
              }
            }
          }
        }
      },
      pages: [{
        name: string,         // Page name (e.g., "Dashboard")
        layout: {
          type: "grid" | "flex" | "stack",  // Layout type
          direction?: "row" | "column",     // Flex direction
          gap?: string,                     // Gap between elements
          columns?: number                  // Number of grid columns
        },
        components: [{
          type: string,       // Component type
          name: string,       // Component name
          layout: {           // Component layout
            type: "grid" | "flex" | "stack",
            direction?: "row" | "column",
            gap?: string,
            columns?: number
          },
          style: {           // Component-specific styles
            [property: string]: string
          },
          children?: [],     // Nested components
          props?: {          // Component props
            [propName: string]: any
          }
        }],
        navigation?: {       // Optional navigation
          position: "top" | "side",
          items: [{
            label: string,   // Navigation item label
            path: string,    // Navigation path
            icon?: string    // Optional icon name
          }]
        }
      }]
    }`,
    {
      designSystem: designSystemSchema,
      pages: z.array(pageDesignSchema)
    },
    {
      title: "Generate UX Design",
      readOnlyHint: true
    },
    async (args: { designSystem: DesignSystem; pages: PageDesign[] }, extra) => {
      const { designSystem, pages } = args;
      const designs: string[] = [];

      // Generate designs for each page
      for (const page of pages) {
        const pageDesign = generatePageDesign(page, designSystem);
        designs.push(pageDesign);
      }

      // Generate global styles
      const globalStyles = generateGlobalStyles(designSystem);

      const code = `
// Global Styles
${globalStyles}

// Page Designs
${designs.join('\n\n')}
`;

      return {
        content: [
          {
            type: "text",
            text: code
          }
        ]
      };
    }
  );

  server.tool(
    "generateDesignPrompt",
    `Generates a comprehensive UX design prompt based on schema analysis.
    
    Input Structure:
    {
      schema: {
        architecture: {
          components: [{
            name: string,          // Component name (e.g., "User", "Task")
            type: string,          // Component type
            relationships: string[], // Related components
            security: string[]     // Security requirements
          }],
          dataFlow: [{
            from: string,         // Source component
            to: string,           // Target component
            type: string          // Relationship type
          }],
          security: [{
            component: string,    // Component name
            access: string[]      // Access levels
          }]
        }
      }
    }`,
    {
      schema: z.object({
        architecture: z.object({
          components: z.array(z.object({
            name: z.string(),
            type: z.string(),
            relationships: z.array(z.string()),
            security: z.array(z.string())
          })),
          dataFlow: z.array(z.object({
            from: z.string(),
            to: z.string(),
            type: z.string()
          })),
          security: z.array(z.object({
            component: z.string(),
            access: z.array(z.string())
          }))
        })
      })
    },
    {
      title: "Generate UX Design Prompt",
      readOnlyHint: true
    },
    async (args: { schema: SchemaAnalysis }, extra) => {
      const { schema } = args;
      const prompt = generateDesignPrompt(schema);

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

function generatePageDesign(page: PageDesign, designSystem: DesignSystem): string {
  const { name, layout, components, navigation } = page;

  return `
// ${name} Page Design
export const ${name}Page = () => (
  <div className="${name.toLowerCase()}-page">
    ${navigation ? generateNavigation(navigation) : ''}
    ${generateLayout(layout, components, designSystem)}
  </div>
);

// ${name} Page Styles
const ${name.toLowerCase()}Styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    ...designSystem.components.page?.style
  },
  ${generateComponentStyles(components, designSystem)}
};
`;
}

function generateNavigation(navigation: NonNullable<PageDesign['navigation']>): string {
  const { position, items } = navigation;
  const navStyle = position === 'top' ? 'horizontal-nav' : 'vertical-nav';

  return `
    <nav className="${navStyle}">
      ${items.map(item => `
        <NavItem
          key="${item.path}"
          to="${item.path}"
          icon={${item.icon || 'null'}}
        >
          ${item.label}
        </NavItem>
      `).join('\n      ')}
    </nav>
  `;
}

function generateLayout(layout: LayoutConfig, components: ComponentDesign[], designSystem: DesignSystem): string {
  const { type, direction, gap, columns } = layout;

  return `
    <div className="page-layout" style={{
      display: '${type}',
      ${direction ? `flexDirection: '${direction}',` : ''}
      ${gap ? `gap: '${gap}',` : ''}
      ${columns ? `gridTemplateColumns: 'repeat(${columns}, 1fr)',` : ''}
      ...designSystem.components.layout?.style
    }}>
      ${components.map(component => generateComponent(component, designSystem)).join('\n      ')}
    </div>
  `;
}

function generateComponent(component: ComponentDesign, designSystem: DesignSystem): string {
  const { type, name, style, children, props } = component;

  return `
    <${type}
      className="${name.toLowerCase()}"
      style={{
        ...designSystem.components.${type.toLowerCase()}?.style,
        ...style
      }}
      ${props ? Object.entries(props).map(([key, value]) => `${key}={${JSON.stringify(value)}}`).join('\n      ') : ''}
    >
      ${children ? children.map(child => generateComponent(child, designSystem)).join('\n      ') : ''}
    </${type}>
  `;
}

function generateComponentStyles(components: ComponentDesign[], designSystem: DesignSystem): string {
  return components.map(component => `
    ${component.name.toLowerCase()}: {
      ...designSystem.components.${component.type.toLowerCase()}?.style,
      ${Object.entries(component.style).map(([key, value]) => `${key}: '${value}'`).join(',\n      ')}
    }
  `).join(',\n  ');
}

function generateGlobalStyles(designSystem: DesignSystem): string {
  return `
// Global Styles
const globalStyles = {
  colors: ${JSON.stringify(designSystem.colors, null, 2)},
  typography: {
    fontFamily: '${designSystem.typography.fontFamily}',
    ...${JSON.stringify(designSystem.typography.headingSizes, null, 2)},
    body: {
      fontSize: '${designSystem.typography.bodySize}'
    }
  },
  spacing: {
    unit: '${designSystem.spacing.unit}',
    scale: ${JSON.stringify(designSystem.spacing.scale)}
  }
};

// Theme Provider
export const ThemeProvider = ({ children }) => (
  <ThemeProvider theme={globalStyles}>
    {children}
  </ThemeProvider>
);
`;
}

function generateDesignPrompt(schema: SchemaAnalysis): string {
  const { architecture } = schema;
  const components = architecture.components;
  const dataFlows = architecture.dataFlow;
  const security = architecture.security;

  return `
# React Admin UX Design Requirements and Guidelines

## 1. Information Architecture & Layout
${generateInformationArchitecture(components, dataFlows)}

## 2. React Admin Navigation & Routing
${generateReactAdminNavigation(components, dataFlows)}

## 3. Component Design & React Admin Integration
${generateReactAdminComponentGuidelines(components)}

## 4. Data Visualization & Dashboard Design
${generateReactAdminVisualizationRequirements(components, dataFlows)}

## 5. Interactive Features & User Experience
${generateReactAdminInteractionPatterns(components, dataFlows)}

## 6. Security & Access Control
${generateReactAdminSecurityGuidelines(security)}

## 7. Responsive Design & Mobile Experience
${generateReactAdminResponsiveRequirements(components)}

## 8. Accessibility & Internationalization
${generateReactAdminAccessibilityGuidelines(components)}

## 9. Performance & Data Management
${generateReactAdminPerformanceGuidelines(components, dataFlows)}

## 10. Design System & Theme Customization
${generateReactAdminDesignSystemRecommendations(components)}
`;
}

function generateReactAdminNavigation(components: SchemaAnalysis['architecture']['components'], dataFlows: SchemaAnalysis['architecture']['dataFlow']): string {
  return `
### React Admin Resource Configuration
${components.map(comp => `#### ${comp.name} Resource
- Resource Name: ${comp.name.toLowerCase()}
- List View: ${determineListConfiguration(comp)}
- Edit View: ${determineEditConfiguration(comp)}
- Show View: ${determineShowConfiguration(comp)}
- Create View: ${determineCreateConfiguration(comp)}`).join('\n\n')}

### Navigation Structure
- Use React Admin's <Resource> components for automatic routing
- Implement custom routes for complex navigation flows
- Configure breadcrumbs for deep navigation
- Add custom menu items for special features

### Menu Configuration
- Group related resources in the sidebar
- Use icons for better visual recognition
- Implement collapsible menu sections
- Add custom menu items for dashboards

### Routing Best Practices
- Use React Admin's built-in routing system
- Implement custom routes for special features
- Handle deep linking and bookmarking
- Manage route permissions based on user roles`;
}

// function generateReactAdminComponentGuidelines(components: SchemaAnalysis['architecture']['components']): string {
//   return `
// ### React Admin Component Integration
// ${components.map(comp => `#### ${comp.name} Components
// - List Component: ${determineListComponent(comp)}
// - Edit Component: ${determineEditComponent(comp)}
// - Show Component: ${determineShowComponent(comp)}
// - Create Component: ${determineCreateComponent(comp)}
// - Custom Components: ${determineCustomComponents(comp)}`).join('\n\n')}

// ### Form Design Guidelines
// - Use React Admin's <SimpleForm> or <TabbedForm> based on complexity
// - Implement custom input components for special fields
// - Add validation using react-hook-form
// - Include field-level help text and tooltips

// ### List View Guidelines
// - Configure columns based on data importance
// - Implement sorting and filtering
// - Add bulk actions for common operations
// - Include custom actions in the list view

// ### Detail View Guidelines
// - Use <Show> component with custom layout
// - Implement tabs for complex data
// - Add related data sections
// - Include action buttons for common operations`;
// }

// function generateReactAdminVisualizationRequirements(components: SchemaAnalysis['architecture']['components'], dataFlows: SchemaAnalysis['architecture']['dataFlow']): string {
//   return `
// ### Dashboard Design
// ${components.map(comp => `#### ${comp.name} Dashboard
// - Key Metrics: ${determineKeyMetrics(comp)}
// - Charts: ${determineCharts(comp)}
// - Data Cards: ${determineDataCards(comp)}
// - Recent Activity: ${determineRecentActivity(comp)}`).join('\n\n')}

// ### Data Visualization Components
// - Use @mui/x-charts for standard charts
// - Implement custom charts for specific needs
// - Add interactive features to charts
// - Include data export options

// ### Dashboard Layout
// - Use grid system for responsive layout
// - Implement collapsible sections
// - Add refresh controls
// - Include date range selectors

// ### Real-time Updates
// - Implement WebSocket connections for live data
// - Add polling for periodic updates
// - Show loading states during updates
// - Handle offline scenarios gracefully`;
// }

// function generateReactAdminInteractionPatterns(components: SchemaAnalysis['architecture']['components'], dataFlows: SchemaAnalysis['architecture']['dataFlow']): string {
//   return `
// ### User Interactions
// ${components.map(comp => `#### ${comp.name} Interactions
// - Form Interactions: ${determineFormInteractions(comp)}
// - List Interactions: ${determineListInteractions(comp)}
// - Detail View Interactions: ${determineDetailInteractions(comp)}
// - Bulk Actions: ${determineBulkActions(comp)}`).join('\n\n')}

// ### Form Interactions
// - Implement field-level validation
// - Add auto-save functionality
// - Show inline help and tooltips
// - Handle complex field dependencies

// ### List Interactions
// - Add inline editing capabilities
// - Implement drag-and-drop reordering
// - Include quick action buttons
// - Add row selection and bulk actions

// ### Search and Filter
// - Implement advanced search
// - Add custom filters
// - Include saved searches
// - Show filter combinations`;
// }

// function generateReactAdminSecurityGuidelines(security: SchemaAnalysis['architecture']['security']): string {
//   return `
// ### React Admin Security
// ${security.map(sec => `#### ${sec.component} Security
// - Resource Access: ${determineResourceAccess(sec)}
// - Field-level Security: ${determineFieldSecurity(sec)}
// - Action Permissions: ${determineActionPermissions(sec)}`).join('\n\n')}

// ### Authentication Integration
// - Implement custom authProvider
// - Handle token management
// - Add session timeout
// - Implement refresh token logic

// ### Authorization
// - Use React Admin's permissions system
// - Implement custom permission checks
// - Add role-based access control
// - Handle field-level permissions`;
// }

function generateReactAdminResponsiveRequirements(components: SchemaAnalysis['architecture']['components']): string {
  return `
### Responsive Design
${components.map(comp => `#### ${comp.name} Responsive Design
- Mobile Layout: ${determineMobileLayout(comp)}
- Tablet Layout: ${determineTabletLayout(comp)}
- Desktop Layout: ${determineDesktopLayout(comp)}`).join('\n\n')}

### Responsive Components
- Use MUI's responsive components
- Implement custom responsive layouts
- Add touch-friendly interactions
- Optimize for different screen sizes

### Mobile Experience
- Implement bottom navigation
- Add pull-to-refresh
- Optimize forms for mobile
- Handle touch gestures`;
}

// function generateReactAdminAccessibilityGuidelines(components: SchemaAnalysis['architecture']['components']): string {
//   return `
// ### Accessibility Features
// ${components.map(comp => `#### ${comp.name} Accessibility
// - Keyboard Navigation: ${determineKeyboardAccessibility(comp)}
// - Screen Reader Support: ${determineScreenReaderSupport(comp)}
// - Color Contrast: ${determineColorContrast(comp)}`).join('\n\n')}

// ### Internationalization
// - Implement i18n using react-i18next
// - Add RTL support
// - Handle date and number formatting
// - Support multiple languages

// ### Accessibility Best Practices
// - Use semantic HTML elements
// - Add ARIA labels and roles
// - Implement keyboard shortcuts
// - Ensure sufficient color contrast`;
// }

// function generateReactAdminPerformanceGuidelines(components: SchemaAnalysis['architecture']['components'], dataFlows: SchemaAnalysis['architecture']['dataFlow']): string {
//   return `
// ### Performance Optimization
// ${components.map(comp => `#### ${comp.name} Performance
// - Data Loading: ${determineDataLoading(comp)}
// - Caching Strategy: ${determineCachingStrategy(comp)}
// - Component Optimization: ${determineComponentOptimization(comp)}`).join('\n\n')}

// ### Data Management
// - Implement efficient data fetching
// - Use optimistic updates
// - Add data caching
// - Handle offline scenarios

// ### Performance Best Practices
// - Implement code splitting
// - Use React.memo for expensive components
// - Optimize re-renders
// - Add loading states and skeletons`;
// }

// function generateReactAdminDesignSystemRecommendations(components: SchemaAnalysis['architecture']['components']): string {
//   return `
// ### React Admin Theme Customization
// ${components.map(comp => `#### ${comp.name} Theme
// - Component Styling: ${determineComponentStyling(comp)}
// - Typography: ${determineTypography(comp)}
// - Color Scheme: ${determineColorScheme(comp)}`).join('\n\n')}

// ### Design System Implementation
// - Extend MUI theme
// - Create custom components
// - Implement consistent spacing
// - Use design tokens

// ### Theme Customization
// - Create custom theme
// - Add dark mode support
// - Implement brand colors
// - Customize component styles`;
// }

// Helper functions for determining specific aspects
function determineListConfiguration(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'Sortable list with status filters, priority indicators, and assignee' :
    component.type === 'User' ? 
    'Grid view with role badges, status indicators, and quick actions' :
    'Standard list with filters and bulk actions';
}

function determineEditConfiguration(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'Tabbed form with main details, assignments, and history' :
    component.type === 'User' ? 
    'Multi-section form with profile, roles, and permissions' :
    'Standard edit form with validation';
}

function determineShowConfiguration(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'Detailed view with status timeline, comments, and related tasks' :
    component.type === 'User' ? 
    'Profile view with activity history and role information' :
    'Standard detail view with related data';
}

function determineCreateConfiguration(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'Wizard-style form with step-by-step creation' :
    component.type === 'User' ? 
    'Multi-step form with role assignment' :
    'Standard create form';
}

function determineListComponent(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'Custom DataGrid with status indicators and quick actions' :
    component.type === 'User' ? 
    'CardGrid with user avatars and role badges' :
    'Standard DataGrid with filters';
}

function determineEditComponent(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'TabbedForm with custom fields and validation' :
    component.type === 'User' ? 
    'MultiSectionForm with role management' :
    'SimpleForm with standard fields';
}

function determineShowComponent(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'Custom Show with timeline and comments' :
    component.type === 'User' ? 
    'ProfileShow with activity feed' :
    'Standard Show component';
}

function determineCreateComponent(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'WizardForm with step validation' :
    component.type === 'User' ? 
    'MultiStepForm with role selection' :
    'SimpleForm with validation';
}

function determineCustomComponents(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'StatusTimeline, CommentSection, AssignmentPicker' :
    component.type === 'User' ? 
    'RoleManager, ActivityFeed, PermissionMatrix' :
    'CustomField, ValidationWrapper';
}

function determineKeyMetrics(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'Completion rate, Average time, Priority distribution' :
    component.type === 'User' ? 
    'Active users, Role distribution, Activity level' :
    'Count, Status, Trends';
}

function determineCharts(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'Status pie chart, Timeline view, Priority bar chart' :
    component.type === 'User' ? 
    'Activity line chart, Role distribution, Usage metrics' :
    'Standard charts based on data type';
}

function determineDataCards(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'Status summary, Priority overview, Assignment stats' :
    component.type === 'User' ? 
    'User stats, Role summary, Activity metrics' :
    'Key metrics, Status cards';
}

function determineRecentActivity(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'Status changes, Comments, Assignments' :
    component.type === 'User' ? 
    'Login history, Role changes, Actions' :
    'Recent updates, Changes';
}

function determineFormInteractions(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'Auto-save, Field validation, Dynamic fields' :
    component.type === 'User' ? 
    'Role-based fields, Permission checks, Validation' :
    'Standard form interactions';
}

function determineListInteractions(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'Drag-and-drop, Quick edit, Bulk actions' :
    component.type === 'User' ? 
    'Role assignment, Status toggle, Batch update' :
    'Standard list interactions';
}

function determineDetailInteractions(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'Status update, Comment addition, Assignment change' :
    component.type === 'User' ? 
    'Role management, Permission update, Profile edit' :
    'Standard detail interactions';
}

function determineBulkActions(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'Status update, Assignment, Delete' :
    component.type === 'User' ? 
    'Role update, Status change, Delete' :
    'Standard bulk actions';
}

function determineResourceAccess(security: SchemaAnalysis['architecture']['security'][0]): string {
  return `Control access to ${security.component} resource based on ${security.access.join(', ')}`;
}

function determineFieldSecurity(security: SchemaAnalysis['architecture']['security'][0]): string {
  return `Implement field-level permissions for ${security.component} based on ${security.access.join(', ')}`;
}

function determineActionPermissions(security: SchemaAnalysis['architecture']['security'][0]): string {
  return `Control actions (create, edit, delete) for ${security.component} based on ${security.access.join(', ')}`;
}

function determineMobileLayout(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'Stack layout with collapsible sections' :
    component.type === 'User' ? 
    'Card layout with swipe actions' :
    'Responsive grid layout';
}

function determineTabletLayout(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'Two-column layout with main content and sidebar' :
    component.type === 'User' ? 
    'Grid layout with expanded cards' :
    'Adaptive grid layout';
}

function determineDesktopLayout(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'Multi-column layout with detailed views' :
    component.type === 'User' ? 
    'Dashboard layout with widgets' :
    'Full-featured layout';
}

function determineKeyboardAccessibility(component: SchemaAnalysis['architecture']['components'][0]): string {
  return 'Implement keyboard navigation, shortcuts, and focus management';
}

function determineDataLoading(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'Pagination with infinite scroll, Optimistic updates' :
    component.type === 'User' ? 
    'Lazy loading with caching, Background sync' :
    'Standard data loading';
}

function determineComponentOptimization(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'Memoized components, Virtualized lists' :
    component.type === 'User' ? 
    'Lazy-loaded components, Cached data' :
    'Standard optimization';
}

function determineComponentStyling(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'Status-based styling, Priority indicators' :
    component.type === 'User' ? 
    'Role-based styling, Activity indicators' :
    'Consistent component styling';
}

function determineColorScheme(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 
    'Status-based colors, Priority indicators' :
    component.type === 'User' ? 
    'Role-based colors, Activity indicators' :
    'Brand colors with semantic meaning';
}

function generateInformationArchitecture(components: SchemaAnalysis['architecture']['components'], dataFlows: SchemaAnalysis['architecture']['dataFlow']): string {
  return `
### Component Hierarchy
${components.map(comp => `- ${comp.name} (${comp.type})
  - Related to: ${comp.relationships.join(', ')}`).join('\n')}

### Data Relationships
${dataFlows.map(flow => `- ${flow.from} → ${flow.to} (${flow.type})`).join('\n')}

### Key Considerations
- Organize components based on their relationships and data flow
- Ensure logical grouping of related information
- Maintain clear hierarchy in information presentation
- Consider user mental models when structuring content`;
}

function generateReactAdminComponentGuidelines(components: SchemaAnalysis['architecture']['components']): string {
  return `
### React Admin Component Integration
${components.map(comp => `#### ${comp.name} Components
- List Component: ${determineListComponent(comp)}
- Edit Component: ${determineEditComponent(comp)}
- Show Component: ${determineShowComponent(comp)}
- Create Component: ${determineCreateComponent(comp)}
- Custom Components: ${determineCustomComponents(comp)}`).join('\n\n')}

### Form Design Guidelines
- Use React Admin's <SimpleForm> or <TabbedForm> based on complexity
- Implement custom input components for special fields
- Add validation using react-hook-form
- Include field-level help text and tooltips

### List View Guidelines
- Configure columns based on data importance
- Implement sorting and filtering
- Add bulk actions for common operations
- Include custom actions in the list view

### Detail View Guidelines
- Use <Show> component with custom layout
- Implement tabs for complex data
- Add related data sections
- Include action buttons for common operations`;
}

function generateReactAdminVisualizationRequirements(components: SchemaAnalysis['architecture']['components'], dataFlows: SchemaAnalysis['architecture']['dataFlow']): string {
  return `
### Dashboard Design
${components.map(comp => `#### ${comp.name} Dashboard
- Key Metrics: ${determineKeyMetrics(comp)}
- Charts: ${determineCharts(comp)}
- Data Cards: ${determineDataCards(comp)}
- Recent Activity: ${determineRecentActivity(comp)}`).join('\n\n')}

### Data Visualization Components
- Use @mui/x-charts for standard charts
- Implement custom charts for specific needs
- Add interactive features to charts
- Include data export options

### Dashboard Layout
- Use grid system for responsive layout
- Implement collapsible sections
- Add refresh controls
- Include date range selectors

### Real-time Updates
- Implement WebSocket connections for live data
- Add polling for periodic updates
- Show loading states during updates
- Handle offline scenarios gracefully`;
}

function generateReactAdminInteractionPatterns(components: SchemaAnalysis['architecture']['components'], dataFlows: SchemaAnalysis['architecture']['dataFlow']): string {
  return `
### User Interactions
${components.map(comp => `#### ${comp.name} Interactions
- Form Interactions: ${determineFormInteractions(comp)}
- List Interactions: ${determineListInteractions(comp)}
- Detail View Interactions: ${determineDetailInteractions(comp)}
- Bulk Actions: ${determineBulkActions(comp)}`).join('\n\n')}

### Form Interactions
- Implement field-level validation
- Add auto-save functionality
- Show inline help and tooltips
- Handle complex field dependencies

### List Interactions
- Add inline editing capabilities
- Implement drag-and-drop reordering
- Include quick action buttons
- Add row selection and bulk actions

### Search and Filter
- Implement advanced search
- Add custom filters
- Include saved searches
- Show filter combinations`;
}

function generateReactAdminSecurityGuidelines(security: SchemaAnalysis['architecture']['security']): string {
  return `
### React Admin Security
${security.map(sec => `#### ${sec.component} Security
- Resource Access: ${determineResourceAccess(sec)}
- Field-level Security: ${determineFieldSecurity(sec)}
- Action Permissions: ${determineActionPermissions(sec)}`).join('\n\n')}

### Authentication Integration
- Implement custom authProvider
- Handle token management
- Add session timeout
- Implement refresh token logic

### Authorization
- Use React Admin's permissions system
- Implement custom permission checks
- Add role-based access control
- Handle field-level permissions`;
}

function generateReactAdminAccessibilityGuidelines(components: SchemaAnalysis['architecture']['components']): string {
  return `
### Accessibility Features
${components.map(comp => `#### ${comp.name} Accessibility
- Keyboard Navigation: ${determineKeyboardAccessibility(comp)}
- Screen Reader Support: ${determineScreenReaderSupport(comp)}
- Color Contrast: ${determineColorContrast(comp)}`).join('\n\n')}

### Internationalization
- Implement i18n using react-i18next
- Add RTL support
- Handle date and number formatting
- Support multiple languages

### Accessibility Best Practices
- Use semantic HTML elements
- Add ARIA labels and roles
- Implement keyboard shortcuts
- Ensure sufficient color contrast`;
}

function generateReactAdminPerformanceGuidelines(components: SchemaAnalysis['architecture']['components'], dataFlows: SchemaAnalysis['architecture']['dataFlow']): string {
  return `
### Performance Optimization
${components.map(comp => `#### ${comp.name} Performance
- Data Loading: ${determineDataLoading(comp)}
- Caching Strategy: ${determineCachingStrategy(comp)}
- Component Optimization: ${determineComponentOptimization(comp)}`).join('\n\n')}

### Data Management
- Implement efficient data fetching
- Use optimistic updates
- Add data caching
- Handle offline scenarios

### Performance Best Practices
- Implement code splitting
- Use React.memo for expensive components
- Optimize re-renders
- Add loading states and skeletons`;
}

function generateReactAdminDesignSystemRecommendations(components: SchemaAnalysis['architecture']['components']): string {
  return `
### React Admin Theme Customization
${components.map(comp => `#### ${comp.name} Theme
- Component Styling: ${determineComponentStyling(comp)}
- Typography: ${determineTypography(comp)}
- Color Scheme: ${determineColorScheme(comp)}`).join('\n\n')}

### Design System Implementation
- Extend MUI theme
- Create custom components
- Implement consistent spacing
- Use design tokens

### Theme Customization
- Create custom theme
- Add dark mode support
- Implement brand colors
- Customize component styles`;
}

// Helper functions for determining specific aspects
function determinePrimaryActions(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 'Create, Edit, Delete, Assign' :
         component.type === 'User' ? 'Create, Edit, Delete, Manage Roles' :
         'View, Edit, Delete';
}

function determineKeyFeatures(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 'Status tracking, Priority management, Assignment' :
         component.type === 'User' ? 'Role management, Profile settings, Permissions' :
         'Data management, Relationships, History';
}

function determineLayoutConsiderations(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 'List view with filters, Detail view with actions' :
         component.type === 'User' ? 'Grid layout for user cards, Detail view with tabs' :
         'Flexible layout based on content type';
}

function determineVisualizations(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 'Progress charts, Status distribution, Timeline' :
         component.type === 'User' ? 'Activity graphs, Role distribution' :
         'Data trends, Relationship maps';
}

function determineDataRelationships(component: SchemaAnalysis['architecture']['components'][0], dataFlows: SchemaAnalysis['architecture']['dataFlow']): string {
  const relatedFlows = dataFlows.filter(flow => flow.from === component.name || flow.to === component.name);
  return relatedFlows.map(flow => `${flow.from} → ${flow.to}`).join(', ');
}

function determineUpdateFrequency(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 'Real-time for status, Periodic for metrics' :
         component.type === 'User' ? 'On-demand, Periodic for activity' :
         'As needed, Based on user actions';
}

function determinePrimaryInteractions(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 'Drag-and-drop, Quick edit, Filter/Sort' :
         component.type === 'User' ? 'Role assignment, Permission management' :
         'Data manipulation, Relationship management';
}

function determineUserFlows(component: SchemaAnalysis['architecture']['components'][0], dataFlows: SchemaAnalysis['architecture']['dataFlow']): string {
  const flows = dataFlows.filter(flow => flow.from === component.name || flow.to === component.name);
  return flows.map(flow => `${flow.from} → ${flow.to}`).join(', ');
}

function determineFeedbackRequirements(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 'Status updates, Action confirmations' :
         component.type === 'User' ? 'Permission changes, Role updates' :
         'Operation results, Error states';
}

function determineSecurityConsiderations(security: SchemaAnalysis['architecture']['security'][0]): string {
  return `Access control for ${security.access.join(', ')} operations`;
}

function determineCriticalFeatures(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 'Status view, Basic actions' :
         component.type === 'User' ? 'Profile view, Role management' :
         'Core functionality, Essential data';
}

function determineMobileConsiderations(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 'Touch-friendly actions, Simplified view' :
         component.type === 'User' ? 'Compact profile, Essential roles' :
         'Responsive layout, Touch targets';
}

function determineLayoutAdaptations(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 'Stack layout, Collapsible sections' :
         component.type === 'User' ? 'Card layout, Tabbed interface' :
         'Adaptive grid, Responsive containers';
}

function determineKeyboardNavigation(component: SchemaAnalysis['architecture']['components'][0]): string {
  return 'Full keyboard support, Focus management, Shortcuts';
}

function determineScreenReaderSupport(component: SchemaAnalysis['architecture']['components'][0]): string {
  return 'ARIA labels, Semantic HTML, Screen reader announcements';
}

function determineColorContrast(component: SchemaAnalysis['architecture']['components'][0]): string {
  return 'WCAG AA compliance, High contrast mode support';
}

function determineLoadingPriorities(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 'Critical data first, Lazy load details' :
         component.type === 'User' ? 'Profile data first, Defer roles' :
         'Essential content first, Progressive loading';
}

function determineDataFetching(component: SchemaAnalysis['architecture']['components'][0], dataFlows: SchemaAnalysis['architecture']['dataFlow']): string {
  return 'Optimistic updates, Background sync, Error handling';
}

function determineCachingStrategy(component: SchemaAnalysis['architecture']['components'][0]): string {
  return 'Local storage for preferences, Cache critical data';
}

function determineComponentStyle(component: SchemaAnalysis['architecture']['components'][0]): string {
  return component.type === 'Task' ? 'Clean, Action-oriented' :
         component.type === 'User' ? 'Professional, Role-based' :
         'Consistent, Functional';
}

function determineTypography(component: SchemaAnalysis['architecture']['components'][0]): string {
  return 'Clear hierarchy, Readable sizes, Consistent family';
}

function determineColorUsage(component: SchemaAnalysis['architecture']['components'][0]): string {
  return 'Brand colors, Semantic meaning, Accessibility';
} 