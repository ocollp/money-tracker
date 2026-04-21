import { OAuth2Client } from 'google-auth-library';

const REFRESH_MARGIN_MS = 5 * 60 * 1000;

function getCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required');
  }
  return { clientId, clientSecret };
}

function getOAuth2ClientForCodeExchange(redirectUri) {
  const { clientId, clientSecret } = getCredentials();
  return new OAuth2Client({ clientId, clientSecret, redirectUri });
}

function getOAuth2ClientForRefresh() {
  const { clientId, clientSecret } = getCredentials();
  return new OAuth2Client({ clientId, clientSecret });
}

/** @param {string} code - Authorization code from GIS */
/** @param {string} redirectUri - Must be window.location.origin (popup flow), not "postmessage" */
export async function exchangeCodeForTokens(code, redirectUri) {
  const client = getOAuth2ClientForCodeExchange(redirectUri);
  const { tokens } = await client.getToken({
    code,
    redirect_uri: redirectUri,
  });
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || null,
    expiresAt: tokens.expiry_date || (Date.now() + (tokens.expires_in || 3600) * 1000),
  };
}

export async function refreshAccessToken(refreshToken) {
  const client = getOAuth2ClientForRefresh();
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();
  return {
    accessToken: credentials.access_token,
    expiresAt: credentials.expiry_date || (Date.now() + 3600 * 1000),
  };
}

export async function getValidAccessToken(user, db) {
  const now = Date.now();
  if (user.googleAccessToken && user.googleTokenExpiresAt && user.googleTokenExpiresAt > now + REFRESH_MARGIN_MS) {
    return user.googleAccessToken;
  }

  if (!user.googleRefreshToken) {
    throw new Error('no_refresh_token');
  }

  const refreshed = await refreshAccessToken(user.googleRefreshToken);
  await db.collection('users').updateOne(
    { googleSub: user.googleSub },
    {
      $set: {
        googleAccessToken: refreshed.accessToken,
        googleTokenExpiresAt: refreshed.expiresAt,
        updatedAt: new Date(),
      },
    },
  );

  return refreshed.accessToken;
}
