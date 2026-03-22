export async function fetchGoogleUserInfo(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google userinfo failed: ${res.status} ${text}`);
  }
  const info = await res.json();
  if (!info.sub) throw new Error('Invalid Google token: missing sub');
  return {
    googleSub: info.sub,
    email: info.email || '',
    name: info.name || 'User',
    picture: info.picture || null,
  };
}
