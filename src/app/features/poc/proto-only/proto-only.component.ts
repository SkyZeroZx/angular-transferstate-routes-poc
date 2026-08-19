import {DOCUMENT} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {Component, REQUEST, TransferState, inject, resource} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {firstValueFrom} from 'rxjs';
import type {Policy, StateEvidence} from '../../../core/poc.models';
import {buildPocUrls, captureStateEvidence, json, readKey} from '../shared/poc-helpers';

@Component({
  selector: 'app-proto-only',
  template: `
    <section class="card">
      <h2>__proto__ only / fixed schema</h2>
      <p>The attacker controls only the slug. The backend response has fixed property names, so prototype mutation occurs but no HTTP cache digest can be planted.</p>
      <div>attacker key: <code>{{ rawKey }}</code></div>
    </section>
    <section class="card"><h3>TransferState evidence</h3><pre>{{ json(stateEvidence.value()) }}</pre></section>
    <section class="card"><h3>Inherited fixed-schema read</h3><pre>{{ json(fixedSchemaRead.value()) }}</pre></section>
    <section class="card"><h3>Policy remains authoritative</h3><pre>{{ json(policy.value()) }}</pre></section>
  `,
})
export class ProtoOnlyComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly transferState = inject(TransferState);
  private readonly request = inject(REQUEST, {optional: true});
  private readonly document = inject(DOCUMENT);

  protected readonly rawKey = this.route.snapshot.paramMap.get('key') ?? '__proto__';
  private readonly origin = new URL(this.request?.url ?? this.document.location?.href ?? 'http://127.0.0.1/').origin;
  private readonly urls = buildPocUrls(this.origin, this.rawKey);

  private readonly source = resource<Record<string, unknown>, string>({
    id: this.rawKey,
    params: () => this.urls.fixedRecord,
    loader: ({params}) => firstValueFrom(this.http.get<Record<string, unknown>>(params, {transferCache: false})),
  });

  protected readonly stateEvidence = resource<StateEvidence, true>({
    params: ({chain}) => (chain(this.source), true),
    loader: () => Promise.resolve(captureStateEvidence(this.transferState)),
  });

  protected readonly fixedSchemaRead = resource<ReturnType<typeof readKey>, true>({
    params: ({chain}) => (chain(this.source), true),
    loader: () => Promise.resolve(readKey(this.transferState, 'title')),
  });

  protected readonly policy = resource<Policy, string>({
    params: ({chain}) => (chain(this.source), this.urls.policy),
    loader: ({params}) => firstValueFrom(this.http.get<Policy>(params)),
  });

  protected readonly json = json;
}
