/**
 * @svadmin/sso — OIDC/OAuth2 SSO AuthProvider plugin
 *
 * Usage:
 * ```ts
 * import { createSSOAuthProvider } from '@svadmin/sso';
 * ```
 */

export { createSSOAuthProvider } from './auth-provider';
export type { SSOConfig, TokenStorage } from './auth-provider';
