# Security Notice - Clerk API Keys

## ⚠️ Important Security Information

Your Clerk API keys have been configured in `.env.local`. Please follow these security best practices:

### Development Keys (Current)
- ✅ These are TEST keys (pk_test_*, sk_test_*)
- ✅ Safe for development and testing
- ⚠️ Still should not be committed to public repositories

### Production Keys
When moving to production:
1. Use production keys (pk_live_*, sk_live_*)
2. Store them in secure environment variables
3. Never commit them to version control
4. Use environment-specific deployments

### Your Clerk Configuration
- **Instance**: discrete-mutt-21.clerk.accounts.dev
- **Frontend API**: https://discrete-mutt-21.clerk.accounts.dev
- **Backend API**: https://api.clerk.com
- **JWKS URL**: https://discrete-mutt-21.clerk.accounts.dev/.well-known/jwks.json

### Security Checklist
- [ ] `.env.local` is in `.gitignore`
- [ ] Never share secret keys publicly
- [ ] Rotate keys if exposed
- [ ] Use environment variables in production
- [ ] Enable Clerk security features (MFA, allowed domains)

### If Keys Are Exposed
1. Immediately rotate them in Clerk Dashboard
2. Update all environments with new keys
3. Check for any unauthorized access

## Clerk Dashboard
Manage your keys at: https://dashboard.clerk.com