import { OAuth2Client } from 'google-auth-library';

const REFRESH_MARGIN_MS = 5 * 60 * 1000;

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required');
  }
  return new OAuth2Client(clientId, clientSecret, 'postmessage');
}

export async function exchangeCodeForTokens(code) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || null,
    expiresAt: tokens.expiry_date || (Date.now() + (tokens.expires_in || 3600) * 1000),
  };
}

export async function refreshAccessToken(refreshToken) {
  const client = getOAuth2Client();
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
