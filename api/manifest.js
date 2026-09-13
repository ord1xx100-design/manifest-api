export const config = { runtime: 'edge' };

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const url = new URL(request.url);
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
    headers: { 'X-Auth-Key': 'D4N2MZJp2z8eIh33' },
  });

  return new Response(r.body, {
    status: r.status,
    headers: {
      'Content-Type': r.headers.get('Content-Type') || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
