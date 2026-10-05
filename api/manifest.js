export const config = { runtime: 'edge' };

const DISCORD_CLIENT_ID = '1556625761203523684';
const DISCORD_CLIENT_SECRET = 'ZGWCzEjv-OquV2j6lzjRz2BQ5_9__Hig';
const DISCORD_REDIRECT = 'https://manifest-api-dun.vercel.app/api/manifest?action=discord';
const FRONTEND_URL = 'https://zinextools.base44.app';

export default async function handler(request) {
  const url = new URL(request.url);

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const action = url.searchParams.get('action');

  // === DISCORD OAUTH ===
  if (action === 'discord') {
    const code = url.searchParams.get('code');

    // Шаг 1: редирект на Discord
    if (!code) {
      const params = new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        redirect_uri: DISCORD_REDIRECT,
        response_type: 'code',
       scope: 'identify email guilds',
      });
      return Response.redirect('https://discord.com/oauth2/authorize?' + params);
    }

    // Шаг 2: обмен code на token
    const tokenResp = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_REDIRECT,
      }),
    });

    if (!tokenResp.ok) {
      const err = await tokenResp.text();
      return new Response('Token exchange failed: ' + err, { status: 400 });
    }

    const token = await tokenResp.json();

    // Шаг 3: инфо о юзере
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
       headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // === MANIFEST GENERATOR (существующая логика) ===
  const appid = url.searchParams.get('appid');
  const type = url.searchParams.get('type') || '';

  if (!appid) {
    return new Response(JSON.stringify({ error: 'no appid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  let target = 'https://generator.ryuu.lol/api/download/' + appid;
  if (type) target += '?file_type=' + type;

  const r = await fetch(target, {
    headers: { 'X-Auth-Key': 'IGYNXdYKW9s8ilny' },
  });

  return new Response(r.body, {
    status: r.status,
    headers: {
      'Content-Type': r.headers.get('Content-Type') || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
