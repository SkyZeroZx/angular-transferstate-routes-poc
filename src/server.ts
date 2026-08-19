import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = join(serverDistFolder, '../browser');
const app = express();
const angularApp = new AngularNodeAppEngine({
  allowedHosts : ['*']
});

const collections = new Map<string, Map<string, unknown>>();
const stats = {
  fixedRecordHits: 0,
  settingsMapHits: 0,
  policyHits: 0,
  guardedPolicyHits: 0,
  bootstrapHits: 0,
  profileHits: 0,
  secretHits: 0,
};

app.use(express.json({limit: '256kb'}));

app.post('/api/reset', (_req, res) => {
  collections.clear();
  Object.assign(stats, {
    fixedRecordHits: 0,
    settingsMapHits: 0,
    policyHits: 0,
    guardedPolicyHits: 0,
    bootstrapHits: 0,
    profileHits: 0,
    secretHits: 0,
  });
  res.json({reset: true});
});

app.get('/api/stats', (_req, res) => res.json({...stats}));

/** Realistic low-privilege editor operation: create a collection by slug. */
app.post('/api/editor/collections', (req, res) => {
  const slug = String(req.body?.slug ?? '');
  if (!slug) return void res.status(400).json({error: 'slug required'});
  if (!collections.has(slug)) collections.set(slug, new Map());
  res.status(201).json({slug});
});

/** Realistic dynamic settings operation: setting name and JSON value are user-controlled. */
app.post('/api/editor/collections/:slug/settings', (req, res) => {
  const slug = req.params.slug;
  const name = String(req.body?.name ?? '');
  if (!collections.has(slug)) collections.set(slug, new Map());
  if (!name) return void res.status(400).json({error: 'name required'});
  collections.get(slug)!.set(name, req.body?.value);
  res.status(201).json({slug, name});
});

/** Only the route slug is attacker-controlled. Property names and values are fixed by the backend. */
app.get('/api/cms/fixed/:slug', (req, res) => {
  stats.fixedRecordHits++;
  res.json({
    title: 'Public article',
    description: 'Fixed CMS schema',
    visibility: 'public',
    requestedSlug: req.params.slug,
  });
});

/** The backend legitimately materializes user-created key/value settings into a dictionary. */
app.get('/api/cms/settings-map/:slug', (req, res) => {
  stats.settingsMapHits++;
  const settings = collections.get(req.params.slug) ?? new Map<string, unknown>();
  res.json(Object.fromEntries(settings));
});

app.get('/api/policy', (_req, res) => {
  stats.policyHits++;
  res.setHeader('Cache-Control', 'no-store, private');
  res.json({allowed: false, role: 'anonymous', tenant: 'public', signed: true, source: 'authoritative-policy'});
});

app.get('/api/policy-guarded', (_req, res) => {
  stats.guardedPolicyHits++;
  res.setHeader('Cache-Control', 'no-store, private');
  res.json({allowed: false, role: 'anonymous', tenant: 'public', signed: true, source: 'authoritative-guarded-policy'});
});

app.get('/api/bootstrap', (_req, res) => {
  stats.bootstrapHits++;
  res.setHeader('Cache-Control', 'no-store, private');
  res.json({tenant: 'public', internalFeature: null, signed: true, source: 'authoritative-bootstrap'});
});

app.get('/api/profile', (_req, res) => {
  stats.profileHits++;
  res.setHeader('Cache-Control', 'no-store, private');
  res.json({name: 'anonymous', plan: 'free', signed: true, source: 'authoritative-profile'});
});

app.get('/api/admin-secret', (req, res) => {
  stats.secretHits++;
  res.setHeader('Cache-Control', 'no-store, private');
  if (req.get('X-Service-Token') !== (process.env['POC_SSR_SERVICE_TOKEN'] ?? 'SSR-SERVICE-CREDENTIAL')) {
    return void res.status(403).json({authorized: false, tenant: 'unknown', secret: ''});
  }
  const tenant = String(req.query['tenant'] ?? 'unknown');
  res.json({authorized: true, tenant, secret: `CROSS_TENANT_SECRET_FOR_${tenant.toUpperCase()}`});
});

app.use(express.static(browserDistFolder, {maxAge: '1y', index: false, redirect: false}));
app.use((req, res, next) => {
  angularApp.handle(req)
    .then((response) => response ? writeResponseToNodeResponse(response, res) : next())
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = Number(process.env['PORT'] ?? 4000);
  app.listen(port, '127.0.0.1', () => console.log(`Angular SSR PoC: http://127.0.0.1:${port}`));
}

export const reqHandler = createNodeRequestHandler(app);
