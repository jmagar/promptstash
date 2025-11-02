# Email Package Architecture

## Overview
Comprehensive email management package using React Email and Resend for template-driven email communications.

## Key Features
- Email Template Registry
- Multiple Email Types:
  - Verification Emails
  - Password Reset Emails
  - Email Change Confirmations
- Type-safe email template rendering
- Centralized email configuration

## Email Template Types
Defined in `src/constants.ts`:
- `verify-email`
- `change-email`
- `reset-password`

## Template Registry Pattern
Centralized email template management via `emailTemplates` constant:
- Static subjects
- Dynamic rendering functions
- Type-safe props

## Workflow Example
```typescript
import { sendEmail } from './send-email';
import { emailTemplates } from './constants';

await sendEmail({
  type: 'verify-email',
  to: 'user@example.com',
  props: {
    verificationCode: '123456'
  }
});
```

## Integration Points
- Works seamlessly with `/packages/auth`
- Supports multiple authentication flows
- Highly configurable and extensible

## Email Configuration
- Environment-based configuration
- Supports multiple email providers
- Secure template rendering

## Best Practices
- Keep email templates modular
- Use React Email for consistent rendering
- Validate all email-related inputs
- Log email sending events
- Implement email rate limiting

## Security Considerations
- Sanitize email template props
- Use secure token generation
- Implement email verification flows
- Protect against email enumeration

## Notes
- Regularly update email dependencies
- Monitor email delivery rates
- Implement proper error handling
- Support internationalization