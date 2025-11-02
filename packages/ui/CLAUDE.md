# Workspace UI Library

## Overview
A comprehensive, type-safe UI component library built with shadcn/ui, React 19, and TailwindCSS, following modern web development best practices.

## Configuration
Configured via `components.json`:
```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide"
}
```

## Component Library

### Base Components
- Button
- Input
- Card
- Dialog
- Avatar
- Tooltip
- Spinner
- Skeleton
- Sheet
- Form
- Dropdown Menu

### Specialized Components
- Input OTP (One-Time Password)
- Sidebar
- Separator
- Alert

## Component Addition Workflow
```bash
# Add a new shadcn component
pnpm dlx shadcn@latest add button -c apps/web
```

## Design Principles
- Accessibility-first
- Fully customizable
- Consistent design language
- Performance-optimized
- Type-safe implementations

## Styling Strategy
- TailwindCSS utility classes
- CSS Variables for theming
- Neutral base color palette
- Dark/Light mode support

## Advanced Component Features
- Composable architecture
- Minimal prop drilling
- Server Component compatible
- Responsive design
- Accessibility attributes

## Theming
```typescript
// Theme configuration example
const themeConfig = {
  colors: {
    primary: 'hsl(221.2 83.2% 53.3%)',
    secondary: 'hsl(263.4 70% 50.4%)',
    destructive: 'hsl(0 84.2% 60.2%)'
  },
  borderRadius: {
    default: '0.5rem',
    small: '0.25rem'
  }
}
```

## Performance Optimization
- Minimal runtime overhead
- Tree-shakeable
- Lazy loadable components
- Efficient re-rendering strategies

## Testing
- Visual regression tests
- Accessibility compliance
- Cross-browser compatibility
- Performance benchmarking

## Development Workflow
```bash
# Install dependencies
pnpm install

# Build library
pnpm build

# Run storybook
pnpm storybook
```

## Contribution Guidelines
1. Follow existing component patterns
2. Add comprehensive TypeScript types
3. Include accessibility attributes
4. Write unit and visual tests
5. Document component usage

## Future Roadmap
- [ ] Enhanced theming capabilities
- [ ] More specialized form components
- [ ] Advanced animation integrations
- [ ] Improved server component support