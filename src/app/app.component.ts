import {Component} from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    <h1>Angular TransferState route-by-route PoC</h1>
    <p>Each route adds exactly one attacker capability, so the severity increase is visible.</p>
    <nav class="card">
      <a routerLink="/poc/constructor-only/constructor">constructor only</a> ·
      <a routerLink="/poc/proto-only/__proto__">__proto__ only</a> ·
      <a routerLink="/poc/cache-poison/resource/__proto__">resource cache poison</a> ·
      <a routerLink="/poc/cache-poison/rxresource/__proto__">rxResource cache poison</a> ·
      <a routerLink="/poc/multi-request/__proto__">multi-request poison</a> ·
      <a routerLink="/poc/confused-deputy/__proto__">confused deputy</a> ·
      <a routerLink="/poc/namespaced-safe/__proto__">namespaced control</a>
    </nav>
    <router-outlet />
  `,
})
export class AppComponent {}
