# Web Components Architecture

## Overview
This directory contains reusable React components for the web application, following modern React 19 patterns and shadcn/ui design principles.

## Component Design Principles
- Use functional components with TypeScript
- Prefer composition over inheritance
- Maximize reusability and modularity
- Leverage shadcn/ui base components
- Implement strict type safety

## Component Categories
1. **Auth Components**:
   - `auth-form.tsx`
   - `two-factor-verification.tsx`
   - `two-factor-setup.tsx`
   - `password-form.tsx`
   - `credentials-form.tsx`
   - `delete-account-form.tsx`

2. **Layout Components**:
   - `header.tsx`
   - `app-sidebar.tsx`
   - `nav-user.tsx`

3. **Utility Components**:
   - `theme-switcher.tsx`
   - `logo.tsx`
   - `providers.tsx`

## Workflow: Adding New Components

### Basic Component Creation
```bash
pnpm dlx shadcn@latest add component-name -c apps/web
```

### Best Practices
- Use TypeScript for type safety
- Import base components from `@workspace/ui`
- Keep components focused and single-responsibility
- Use prop destructuring for cleaner code
- Implement default props when applicable

## Component Composition Example
```typescript
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

export function MyComponent({ variant = 'default' }) {
  return (
    <div className="flex gap-2">
      <Input placeholder="Enter value" />
      <Button variant={variant}>Submit</Button>
    </div>
  )
}
```

## Performance Considerations
- Use React.memo() for components with stable props
- Implement proper memoization techniques
- Minimize unnecessary re-renders
- Leverage code-splitting and lazy loading

## Styling
- Use TailwindCSS utility classes
- Prefer shadcn/ui theming system
- Implement responsive design
- Use CSS variables for theme customization

## Testing
- Create unit tests for complex component logic
- Use React Testing Library
- Test component rendering and interactions
- Cover edge cases and different prop combinations

## Icons
- Use Lucide icons from `@workspace/ui`
- Custom icons in `components/icons/`
- Consistent sizing and styling

## Contribution Guidelines
1. Keep components generic and reusable
2. Document complex component logic
3. Add prop type documentation
4. Follow existing naming and structure conventions