# Email Templates Architecture

## Overview

Centralized email template management using React Email for consistent, type-safe email rendering.

## Available Templates

1. `VerificationEmail`
   - Purpose: Email address verification
   - Props: Verification code, user details

2. `ChangeEmailTemplate`
   - Purpose: Confirm email address change
   - Props: New email, verification token

3. `ResetPasswordTemplate`
   - Purpose: Password reset instructions
   - Props: Reset token, user information

## Template Design Principles

- Modular and reusable
- Type-safe props
- Consistent styling
- Responsive design
- Accessibility considerations

## Example Template Structure

```tsx
export const VerificationEmail = ({ verificationCode, userName }: VerificationEmailProps) => {
  return (
    <EmailTemplate>
      <Heading>Verify Your Email</Heading>
      <Text>
        Hi {userName}, your code is: {verificationCode}
      </Text>
    </EmailTemplate>
  );
};
```

## Integration with Email Package

- Registered in `constants.ts`
- Used by `send-email.ts`
- Supports dynamic rendering

## Best Practices

- Keep templates minimal and focused
- Use semantic HTML
- Support dark/light modes
- Internationalize text
- Test across email clients

## Security Considerations

- Never include sensitive information
- Use secure, expiring tokens
- Sanitize all dynamic content
- Implement rate limiting on email sends

## Notes

- Regularly update React Email
- Monitor email rendering across clients
- Implement comprehensive testing
- Consider accessibility guidelines
