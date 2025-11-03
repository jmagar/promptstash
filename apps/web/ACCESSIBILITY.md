# Accessibility Features

This document outlines the accessibility features implemented in the PromptStash web application.

## Overview

The application follows WCAG 2.1 Level AA guidelines and implements comprehensive accessibility features to ensure usability for all users.

## Keyboard Navigation

### Global Shortcuts

Press `?` to view all keyboard shortcuts.

- **Navigation**
  - `Ctrl/Cmd + D` - Go to Dashboard
  - `Ctrl/Cmd + S` - Go to Stash
  - `Ctrl/Cmd + P` - Go to Profile
  - `Ctrl/Cmd + ,` - Go to Settings

- **Search & Actions**
  - `Ctrl/Cmd + K` - Open Search
  - `Ctrl/Cmd + N` - Create New File
  - `Ctrl/Cmd + Shift + N` - Create New Folder

- **File Operations**
  - `Ctrl/Cmd + S` - Save Current File
  - `Esc` - Close Modal/Dialog
  - `Ctrl/Cmd + Enter` - Submit Form

- **Help**
  - `?` - Show Keyboard Shortcuts

### Focus Management

- All interactive elements are keyboard accessible
- Focus indicators are clearly visible
- Tab order follows logical reading order
- Focus is trapped in modals/dialogs
- Skip-to-content link for keyboard users

## Screen Reader Support

### ARIA Labels

All icon buttons and interactive elements include descriptive aria-labels:

```tsx
<button aria-label="Create new file">
  <Plus />
</button>
```

### Semantic HTML

- Proper heading hierarchy (h1, h2, h3)
- Landmark regions (header, nav, main, aside)
- Lists for navigation items
- Forms with associated labels

### Live Regions

- Toast notifications use `aria-live` for screen reader announcements
- Error messages are announced to screen readers
- Loading states are communicated

### Dialog Accessibility

All modals/dialogs include:

- `role="dialog"`
- `aria-labelledby` for title
- `aria-describedby` for description
- Focus trap when open
- Return focus to trigger element when closed

Example:

```tsx
<DialogContent aria-describedby="dialog-description">
  <DialogTitle>Title</DialogTitle>
  <DialogDescription id="dialog-description">Description</DialogDescription>
</DialogContent>
```

## Visual Accessibility

### Color Contrast

- All text meets WCAG AA contrast requirements (4.5:1 for normal text, 3:1 for large text)
- Interactive elements have clear visual states (hover, focus, active)
- Color is not the only indicator of state

### Focus Indicators

Custom focus ring styling:

```css
.focus-visible:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

### Dark Mode Support

- Complete dark mode theme
- Maintains contrast ratios in both themes
- Respects user's system preference
- Manual theme toggle available

## Form Accessibility

### Labels

All form inputs have associated labels:

```tsx
<FormLabel htmlFor="file-name">File Name</FormLabel>
<Input id="file-name" name="file-name" />
```

### Error Messages

- Error messages are associated with inputs using `aria-describedby`
- Errors are announced to screen readers
- Visual error indicators in addition to text

### Required Fields

- Required fields are marked with `aria-required="true"`
- Required indicator is visible and not color-only

## Loading States

### Skeleton Screens

- Skeleton loaders show content structure while loading
- Maintain layout stability (no content jumping)
- Clear indication that content is loading

### Spinners

All loading spinners include:

```tsx
<Spinner aria-label="Loading..." />
```

### Optimistic UI Updates

- Immediate feedback for user actions
- Loading states for async operations
- Success/error feedback via toasts

## Error Handling

### Error Boundaries

- Catch and gracefully handle errors
- Provide recovery options
- Log errors for debugging
- User-friendly error messages

### Error Messages

- Clear, actionable error messages
- Retry options for failed actions
- Context about what went wrong

## Toast Notifications

### Accessibility Features

- Screen reader announcements via Sonner
- Success, error, and info variants
- Action buttons in toasts (e.g., retry)
- Auto-dismiss with sufficient reading time
- Manual dismiss option

Example:

```tsx
toast.error('Failed to save file', {
  description: error.message,
  action: {
    label: 'Retry',
    onClick: () => handleRetry(),
  },
});
```

## Skip Navigation

Skip-to-content link for keyboard users:

- Visible only when focused
- Jumps to main content
- Bypasses repetitive navigation

## Testing

### Automated Testing

Run accessibility tests:

```bash
pnpm test:a11y
```

### Manual Testing Checklist

- [ ] Tab through entire page with keyboard
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Test color contrast with DevTools
- [ ] Test with browser zoom (200%)
- [ ] Test in high contrast mode
- [ ] Test with animations disabled
- [ ] Test keyboard shortcuts
- [ ] Test form validation errors

### Browser Extensions

Recommended testing tools:

- axe DevTools
- WAVE
- Lighthouse Accessibility Audit
- Accessibility Insights

## Best Practices

### When Adding New Features

1. **Use semantic HTML**
   - Choose the right element for the job
   - Don't use `<div>` for interactive elements

2. **Add ARIA labels**
   - Icon buttons need descriptive labels
   - Use `aria-label` or `aria-labelledby`

3. **Test keyboard navigation**
   - Ensure all functionality is keyboard accessible
   - Check tab order is logical

4. **Test with screen reader**
   - Verify announcements are clear
   - Check that content is discoverable

5. **Check color contrast**
   - Use browser DevTools or online tools
   - Test in both light and dark modes

6. **Provide loading states**
   - Never leave users wondering if something is happening
   - Use spinners, skeletons, or progress indicators

7. **Handle errors gracefully**
   - Show clear error messages
   - Provide recovery options
   - Log errors for debugging

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Articles](https://webaim.org/articles/)

## Support

If you encounter accessibility issues, please:

1. Open an issue on GitHub
2. Include browser and assistive technology details
3. Describe the problem and expected behavior
4. Provide steps to reproduce
