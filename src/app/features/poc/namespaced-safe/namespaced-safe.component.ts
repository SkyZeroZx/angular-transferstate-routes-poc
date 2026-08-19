import {DOCUMENT} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {Component, REQUEST, TransferState, inject, resource} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {firstValueFrom} from 'rxjs';
import type {BootstrapConfig, Policy, Profile, StateEvidence} from '../../../core/poc.models';
import {buildPocUrls, captureStateEvidence, json} from '../shared/poc-helpers';

@Component({
  selector: 'app-namespaced-safe',
  template: `
    <section class="card">
      <h2>namespaced safe control</h2>
      <p>The same attacker-controlled slug is namespaced to <code>{{ stateKey }}</code>, so it becomes a normal own property instead of mutating [[Prototype]].</p>
    </section>
    <section class="card"><h3>TransferState evidence</h3><pre>{{ json(stateEvidence.value()) }}</pre></section>
    <section class="card"><h3>Policy</h3><pre>{{ json(policy.value()) }}</pre></section>
    <section class="card"><h3>Bootstrap</h3><pre>{{ json(bootstrap.value()) }}</pre></section>
    <section class="card"><h3>Profile</h3><pre>{{ json(profile.value()) }}</pre></section>
  `,
})
export class NamespacedSafeComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly transferState = inject(TransferState);
  private readonly request = inject(REQUEST, {optional: true});
  private readonly document = inject(DOCUMENT);

  protected readonly rawKey = this.route.snapshot.paramMap.get('key') ?? '__proto__';
  protected readonly stateKey = `cms:${this.rawKey}`;
  private readonly origin = new URL(this.request?.url ?? this.document.location?.href ?? 'http://127.0.0.1/').origin;
  private readonly urls = buildPocUrls(this.origin, this.rawKey);

  private readonly source = resource<Record<string, unknown>, string>({
    id: this.stateKey,
    params: () => this.urls.settingsMap,
    loader: ({params}) => firstValueFrom(this.http.get<Record<string, unknown>>(params, {transferCache: false})),
  });

  protected readonly stateEvidence = resource<StateEvidence, true>({
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

  protected readonly json = json;
}
