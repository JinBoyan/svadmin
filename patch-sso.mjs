import fs from 'fs';
let c = fs.readFileSync('packages/sso/src/auth-provider.ts', 'utf8');

// remove from docblock
c = c.replace(/\/\/ Safe base64url decode[\s\S]*?\n\}\n/g, '');

const helper = `
// Safe base64url decode for JWT payloads
function decodeJwtPayload(token: string): any {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const payloadStr = parts[1];
  const padded = payloadStr + '='.repeat((4 - (payloadStr.length % 4)) % 4);
  const binString = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
  return JSON.parse(new TextDecoder().decode(bytes));
}
`;

// Insert after the real import at line 43
c = c.replace(/import type \{ AuthProvider, Identity \} from '@svadmin\/core';/, match => match + '\n' + helper);

fs.writeFileSync('packages/sso/src/auth-provider.ts', c);
