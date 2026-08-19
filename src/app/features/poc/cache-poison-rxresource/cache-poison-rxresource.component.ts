import {DOCUMENT} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {Component, REQUEST, TransferState, inject, resource} from '@angular/core';
import {rxResource} from '@angular/core/rxjs-interop';
import {ActivatedRoute} from '@angular/router';
import {firstValueFrom} from 'rxjs';
import type {Policy, StateEvidence} from '../../../core/poc.models';
import {buildPocUrls, captureStateEvidence, json} from '../shared/poc-helpers';

@Component({
  selector: 'app-cache-poison-rxresource',
  template: `
    <section class="card">
      <h2>rxResource() → single HttpTransferCache poison</h2>
      <p><code>rxResource()</code> preserves <code>id</code> when delegating to <code>resource()</code>, reaching the same TransferState write.</p>
      <div>TransferState id: <code>{{ rawKey }}</code></div>
    </section>
    <section class="card"><h3>TransferState evidence</h3><pre>{{ json(stateEvidence.value()) }}</pre></section>
    <section class="card"><h3>Poisoned policy response</h3><pre>{{ json(policy.value()) }}</pre></section>
  `,
})
export class CachePoisonRxResourceComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly transferState = inject(TransferState);
  private readonly request = inject(REQUEST, {optional: true});
  private readonly document = inject(DOCUMENT);

  protected readonly rawKey = this.route.snapshot.paramMap.get('key') ?? '__proto__';
  private readonly origin = new URL(this.request?.url ?? this.document.location?.href ?? 'http://127.0.0.1/').origin;
  private readonly urls = buildPocUrls(this.origin, this.rawKey);

  private readonly source = rxResource<Record<string, unknown>, string>({
    id: this.rawKey,
    params: () => this.urls.settingsMap,
    stream: ({params}) => this.http.get<Record<string, unknown>>(params, {transferCache: false}),
  });

  protected readonly stateEvidence = resource<StateEvidence, true>({
    params: ({chain}) => (chain(this.source), true),
    loader: () => Promise.resolve(captureStateEvidence(this.transferState)),
  });

  protected readonly policy = resource<Policy, string>({
    params: ({chain}) => (chain(this.source), this.urls.policy),
    loader: ({params}) => firstValueFrom(this.http.get<Policy>(params)),
  });

  protected readonly json = json;
}
