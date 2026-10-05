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

    const userJson =   // === ПРОВЕРКА ПОДПИСКИ НА DISCORD-СЕРВЕР ===
  const MY_GUILD_ID = '1548789764092723282'; // ← ЗАМЕНИ
  const INVITE_URL = 'https://discord.gg/СЮДА_ИНВАЙТ'; // ← ЗАМЕНИ

  const guildsResp = await fetch('https://discord.com/api/users/@me/guilds', {
    headers: { Authorization: 'Bearer ' + token.access_token },
  });
  const guilds = await guildsResp.json();
  const isMember = Array.isArray(guilds) && guilds.some(g => g.id === MY_GUILD_ID);

  if (!isMember) {
    const blockedHtml = `<!DOCTYPE html>
<html>
<head><title>Требуется подписка</title></head>
<body style="background:#0a0b14;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
<div style="text-align:center;max-width:400px;padding:24px;">
  <div style="font-size:64px;margin-bottom:16px;">🔒</div>
  <h2 style="margin:0 0 12px;">Требуется подписка на Discord</h2>
  <p style="color:#888;margin:0 0 24px;">Чтобы использовать ZINEX, вступите в наш Discord-сервер</p>
  <a href="${INVITE_URL}" target="_blank" 
     style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:16px;">
    Вступить в Discord
  </a>
</div>
</body>
</html>`;
    return new Response(blockedHtml, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
      
    

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
