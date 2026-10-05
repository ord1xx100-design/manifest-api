export const config = { runtime: 'edge' };

const CLIENT_ID = '1556425761203536384';
const CLIENT_SECRET = 'm2AX6m56axUfslIt3AsxdmY1dlaGWF';
const REDIRECT_URI = 'https://manifest-api-dun.vercel.app/api/auth/discord';
const FRONTEND_URL = 'https://zinextools.base44.app';

export default async function handler(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'identify email',
    });
    return Response.redirect('https://discord.com/oauth2/authorize?' + params);
  }

  const tokenResp = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!tokenResp.ok) {
    const err = await tokenResp.text();
    return new Response('Token exchange failed: ' + err, { status: 400 });
  }

  const token = await tokenResp.json();

  const userResp = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: 'Bearer ' + token.access_token },
  });
  const user = await userResp.json();

  const userJson = JSON.stringify({
    id: user.id,
    username: user.username,
    global_name: user.global_name,
    avatar: user.avatar,
    email: user.email,
  });

  const html = `<!DOCTYPE html>
<html>
<head><title>Авторизация...</title></head>
<body style="background:#0a0b14;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
<div style="text-align:center;">
  <div style="font-size:48px;">✓</div>
  <p>Авторизация успешна</p>
  <p style="color:#888;font-size:12px;">Окно закроется автоматически</p>
</div>
<script>
  window.opener.postMessage(${userJson}, '${FRONTEND_URL}');
  setTimeout(() => window.close(), 800);
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
