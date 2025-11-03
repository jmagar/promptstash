# Changelog - Frontend Improvements

## [Unreleased] - 2025-01-03

### Added
- ✨ **Error Boundary Component**: Graceful error handling with user-friendly messages and retry functionality
- ✨ **Route Protection**: Authentication guard for protected routes with automatic redirect to sign-in
- ✨ **Keyboard Shortcuts**: Global keyboard navigation for quick access to all main sections
- ✨ **Skip to Content Link**: Accessibility feature for keyboard and screen reader users
- ✨ **Loading States**: Proper loading indicators during authentication checks
- ✨ **Enhanced API Client**: Unified error handling with `handleResponse` helper function

### Changed
- 🎨 **Branding**: Updated all references from "build-elevate" to "PromptStash"
- 🔗 **GitHub URLs**: Updated repository links to jmagar/promptstash
- 📝 **Site Metadata**: Updated OpenGraph and Twitter card metadata
- 🧭 **Navigation**: Added Stash, Profile, and Settings to sidebar navigation
- ⚙️ **Query Client**: Configured with optimized defaults (staleTime, retry, refetchOnWindowFocus)
- 🔐 **Auth Redirect**: Fixed redirect to go to /sign-in instead of root

### Fixed
- 🐛 **Linting Issues**: Removed unused imports and variables
- 🐛 **Auth Hook**: Fixed redirect path in useAuthUser to properly redirect to sign-in page
- 🐛 **Type Safety**: Ensured all components pass strict TypeScript checks

### Improved
- ♿ **Accessibility**: Added proper ARIA labels, skip links, and keyboard navigation
- 📚 **Documentation**: Updated README with PromptStash branding and feature documentation
- 🎯 **Code Quality**: All code passes ESLint with zero warnings
- 🛡️ **Error Handling**: Consistent error handling across all API methods
- 🔒 **Security**: Protected routes properly check authentication before rendering

## Keyboard Shortcuts

- `Ctrl/Cmd + K` - Search (coming soon)
- `Ctrl/Cmd + D` - Navigate to Dashboard
- `Ctrl/Cmd + S` - Navigate to Stash
- `Ctrl/Cmd + P` - Navigate to Profile
- `Ctrl/Cmd + ,` - Navigate to Settings
- `?` - Show keyboard shortcuts help (coming soon)

## Files Modified

### Core Application
- `apps/web/app/page.tsx` - Updated branding and links
- `apps/web/app/layout.tsx` - Added skip-to-content link and main content ID
- `apps/web/app/(default)/layout.tsx` - NEW: Route protection with auth check
- `apps/web/config/site.ts` - Updated metadata and navigation items

### Components
- `apps/web/components/providers.tsx` - Added error boundary and keyboard shortcuts
- `apps/web/components/error-boundary.tsx` - NEW: Error boundary component
- `apps/web/components/skip-to-content.tsx` - NEW: Accessibility skip link

### Hooks
- `apps/web/hooks/use-auth-user.ts` - Fixed redirect logic
- `apps/web/hooks/use-keyboard-shortcuts.ts` - NEW: Global keyboard shortcuts

### API & Data
- `apps/web/lib/api-client.ts` - Enhanced error handling

### UI Package
- `packages/ui/src/components/promptstash-breadcrumb.tsx` - Removed unused imports

### Pages
- `apps/web/app/(default)/stash/page.tsx` - Fixed unused variables
- `apps/web/app/ui-demo/page.tsx` - Fixed unused variables

## Testing Status

✅ **ESLint**: All files pass with zero warnings
✅ **TypeScript**: All files pass strict type checking
✅ **Code Quality**: Follows project conventions and best practices

## Migration Notes

No breaking changes. All improvements are backward compatible and enhance existing functionality.

## Future Enhancements

- [ ] Implement search modal (Ctrl/Cmd + K)
- [ ] Add keyboard shortcuts help modal (?)
- [ ] Add loading skeleton components for better UX
- [ ] Implement optimistic updates for mutations
- [ ] Add offline support with service workers
- [ ] Implement progressive web app (PWA) features
