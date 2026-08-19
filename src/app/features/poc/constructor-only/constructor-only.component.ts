import {Component, TransferState, inject} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {captureStateEvidence, json, readAbsentKey} from '../shared/poc-helpers';

@Component({
  selector: 'app-constructor-only',
  template: `
    <section class="card">
      <h2>constructor-only</h2>
      <p>Attacker controls only a StateKey string. No write or prototype mutation is required.</p>
      <div>attacker key: <code>{{ rawKey }}</code></div>
    </section>
    <section class="card"><h3>Absent-key read</h3><pre>{{ json(evidence) }}</pre></section>
    <section class="card"><h3>Store state</h3><pre>{{ json(state) }}</pre></section>
  `,
})
export class ConstructorOnlyComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly transferState = inject(TransferState);

  protected readonly rawKey = this.route.snapshot.paramMap.get('key') ?? 'constructor';
  protected readonly evidence = readAbsentKey(this.transferState, this.rawKey);
  protected readonly state = captureStateEvidence(this.transferState);
  protected readonly json = json;
}
