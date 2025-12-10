---
inclusion: always
---

# Zeger POS System - Development Guidelines

## Core Principles

1. **Focus on Code, Not Documentation** - Prioritize actual code implementation over documentation unless explicitly requested
2. **Use MCP for External Services** - Always use Model Context Protocol (MCP) tools for Supabase operations and external integrations to ensure accuracy
3. **Follow Framework Best Practices** - Adhere to established patterns for React, TypeScript, Tailwind CSS, and Supabase

## Tech Stack & Architecture

### Frontend Stack
- **React 18** with TypeScript and Vite
- **Tailwind CSS** for styling with custom Zeger color scheme
- **shadcn/ui** components with Radix UI primitives
- **React Router** for navigation with role-based routing
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation

### Backend & Database
- **Supabase** for database, authentication, and edge functions
- **PostgreSQL** with Row Level Security (RLS)
- Use MCP Supabase tools for all database operations

## Code Organization

### File Structure
- Components: `/src/components/{category}/{ComponentName}.tsx`
- Pages: `/src/pages/{PageName}.tsx` or `/src/pages/{category}/{PageName}.tsx`
- Hooks: `/src/hooks/use{HookName}.tsx`
- Utils: `/src/lib/{utility-name}.ts`
- Types: `/src/lib/types.ts` or `/src/integrations/supabase/types.ts`

### Naming Conventions
- **Components**: PascalCase (`ProductCard.tsx`)
- **Files**: kebab-case for utilities (`transaction-utils.ts`)
- **Hooks**: camelCase with "use" prefix (`useCart.tsx`)
- **Constants**: UPPER_SNAKE_CASE
- **Variables/Functions**: camelCase

## Component Patterns

### Component Structure
```typescript
// Import order: React, external libs, internal components, hooks, utils, types
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';

interface ComponentProps {
  // Props interface
}

export const ComponentName = ({ prop }: ComponentProps) => {
  // Component logic
  return (
    // JSX
  );
};
```

### State Management
- Use `useState` for local component state
- Use `TanStack Query` for server state
- Use custom hooks for shared logic
- Use `useAuth` and `usePOSAuth` for authentication state

### Error Handling
- Wrap components in `ErrorBoundary` for critical sections
- Use `toast` from sonner for user notifications
- Handle loading states with `LoadingSpinner` component

## Styling Guidelines

### Zeger Brand Colors
- Primary Red: `bg-zeger-red` (#DC2626)
- Primary Red Dark: `bg-zeger-red-dark` (#B91C1C)
- Accent Cream: `bg-zeger-cream` (#FEF3C7)
- Text Brown: `text-zeger-brown` (#92400E)

### Design Patterns
- Mobile-first responsive design
- Use shadcn/ui components as base
- Consistent spacing with Tailwind spacing scale
- Clear visual hierarchy with typography scale

## Role-Based Access Control

### User Roles
- `ho_admin` - Head Office Admin
- `branch_manager` - Branch Manager
- `sb_branch_manager` - Small Branch Manager
- `bh_kasir`, `sb_kasir` - Cashier roles for POS app
- `rider`, `sb_rider`, `bh_rider` - Delivery riders
- `customer` - Customer app users
- `finance` - Finance team
- `bh_report` - Branch Hub Report users

### Route Protection
- Use `RoleBasedRoute` component for page-level protection
- Use `POSProtectedRoute` for POS-specific routes
- Check permissions in components using `usePermissions` hook

## Testing Standards

### Test Structure
- **Unit Tests**: Component rendering and user interactions
- **Integration Tests**: Feature flows in `/src/integration/`
- **Property-Based Tests**: Business logic with fast-check library
- Co-locate test files: `ComponentName.test.tsx`

### Test Patterns
```typescript
import { render, screen } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

## Database & API Guidelines

### Supabase Operations
- Always use MCP Supabase tools for database operations
- Follow RLS policies for data security
- Use TypeScript types from `/src/integrations/supabase/types.ts`
- Handle offline scenarios with `useOffline` and `useOfflineSync` hooks

### Edge Functions
- Located in `/supabase/functions/`
- Use TypeScript with Deno runtime
- Handle CORS and authentication properly
- Return consistent JSON responses

## Performance & Optimization

### Code Splitting
- Use React.lazy() for route-level code splitting
- Implement proper loading states
- Use TanStack Query for caching and background updates

### Bundle Optimization
- Import only needed utilities from libraries
- Use tree-shaking friendly imports
- Optimize images and assets

## Language & Localization

- **Primary Language**: Indonesian (Bahasa Indonesia)
- Use Indonesian for all user-facing text
- Keep technical terms and code in English
- Use consistent terminology across the application

## Development Workflow

### Before Implementation
1. Check existing patterns in similar components
2. Verify role permissions and access control
3. Use MCP tools for Supabase operations
4. Follow the established file structure

### Code Quality
- Use TypeScript strictly (avoid `any` types)
- Write descriptive variable and function names
- Add JSDoc comments for complex functions
- Ensure accessibility compliance (ARIA labels, keyboard navigation)

### Testing Requirements
- Write tests for new components and hooks
- Update integration tests for feature changes
- Run `npm run test` before committing
- Ensure type checking passes with `npm run type-check`