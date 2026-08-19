const origin = process.env.POC_ORIGIN ?? 'http://127.0.0.1:4000';

// Seed the same low-privilege CMS data used by the manual PoC.
await import('./seed.mjs');

function htmlToText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

async function getJson(path) {
  const response = await fetch(`${origin}${path}`);
  if (!response.ok) throw new Error(`GET ${path} -> ${response.status}`);
  return response.json();
}

async function getHtml(path) {
  const response = await fetch(`${origin}${path}`, {
    headers: {accept: 'text/html'},
  });
  if (!response.ok) throw new Error(`GET ${path} -> ${response.status}`);
  return response.text();
}

function diffStats(before, after) {
  return Object.fromEntries(
    Object.keys(after).map((key) => [key, after[key] - (before[key] ?? 0)]),
  );
}

function expectIncludes(text, fragments, name) {
  for (const fragment of fragments) {
    if (!text.includes(fragment)) {
      throw new Error(`${name}: HTML did not contain ${JSON.stringify(fragment)}`);
    }
  }
}

function expectExcludes(text, fragments, name) {
  for (const fragment of fragments) {
    if (text.includes(fragment)) {
      throw new Error(`${name}: HTML unexpectedly contained ${JSON.stringify(fragment)}`);
    }
  }
}

function expectStats(actual, expected, name) {
  for (const [key, value] of Object.entries(expected)) {
    if (actual[key] !== value) {
      throw new Error(`${name}: expected ${key}=${value}, got ${actual[key]}`);
    }
  }
}

const cases = [
  {
    name: 'constructor-only',
    route: '/poc/constructor-only/constructor',
    html: [
      'constructor-only',
      '"hasKey": false',
      '"returnedDefault": false',
      '"returnedType": "function"',
      '"functionName": "Object"',
      '"prototypeMutated": false',
    ],
  },
  {
    name: 'proto-only',
    route: '/poc/proto-only/__proto__',
    html: [
      '__proto__ only / fixed schema',
      '"prototypeMutated": true',
      '"value": "Public article"',
      '"source": "authoritative-policy"',
    ],
    notHtml: ['attacker-inherited-policy'],
    stats: {fixedRecordHits: 1, policyHits: 1, secretHits: 0},
  },
  {
    name: 'cache-poison/resource',
    route: '/poc/cache-poison/resource/__proto__',
    html: [
      'single HttpTransferCache poison',
      '"prototypeMutated": true',
      '"source": "attacker-inherited-policy"',
      '"allowed": true',
    ],
    stats: {settingsMapHits: 1, policyHits: 0},
  },
  {
    name: 'cache-poison/rxresource',
    route: '/poc/cache-poison/rxresource/__proto__',
    html: [
      'rxResource()',
      '"prototypeMutated": true',
      '"source": "attacker-inherited-policy"',
    ],
    stats: {settingsMapHits: 1, policyHits: 0},
  },
  {
    name: 'multi-request',
    route: '/poc/multi-request/__proto__',
    html: [
      'attacker-inherited-policy',
      'attacker-inherited-bootstrap',
      'attacker-inherited-profile',
    ],
    stats: {settingsMapHits: 1, policyHits: 0, bootstrapHits: 0, profileHits: 0},
  },
  {
    name: 'confused-deputy',
    route: '/poc/confused-deputy/__proto__',
    html: [
      'attacker-inherited-policy',
      'attacker-inherited-bootstrap',
      '"authorized": true',
      'CROSS_TENANT_SECRET_FOR_VICTIM-ENTERPRISE',
    ],
    stats: {
      settingsMapHits: 1,
      policyHits: 0,
      bootstrapHits: 0,
      profileHits: 0,
      secretHits: 1,
    },
  },
  {
    name: 'namespaced-safe',
    route: '/poc/namespaced-safe/__proto__',
    html: [
      'namespaced safe control',
      'cms:__proto__',
      '"prototypeMutated": false',
      'authoritative-policy',
      'authoritative-bootstrap',
      'authoritative-profile',
    ],
    notHtml: ['CROSS_TENANT_SECRET_FOR_VICTIM-ENTERPRISE'],
    stats: {
      settingsMapHits: 1,
      policyHits: 1,
      bootstrapHits: 1,
      profileHits: 1,
      secretHits: 0,
    },
  },
];

console.log('\nValidating SSR HTML...\n');

for (const test of cases) {
  const before = await getJson('/api/stats');
  const html = await getHtml(test.route);
  const text = htmlToText(html);
  const after = await getJson('/api/stats');
  const delta = diffStats(before, after);

  expectIncludes(text, test.html ?? [], test.name);
  expectExcludes(text, test.notHtml ?? [], test.name);
  if (test.stats) expectStats(delta, test.stats, test.name);

  console.log(`✓ ${test.name}`);
}

console.log('\nAll TransferState PoC cases validated successfully.');
