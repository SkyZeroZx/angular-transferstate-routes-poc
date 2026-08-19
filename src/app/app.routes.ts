import { Routes } from "@angular/router";
import { ConstructorOnlyComponent } from "./features/poc/constructor-only/constructor-only.component";
import { ProtoOnlyComponent } from "./features/poc/proto-only/proto-only.component";
import { CachePoisonResourceComponent } from "./features/poc/cache-poison-resource/cache-poison-resource.component";
import { CachePoisonRxResourceComponent } from "./features/poc/cache-poison-rxresource/cache-poison-rxresource.component";
import { MultiRequestComponent } from "./features/poc/multi-request/multi-request.component";
import { ConfusedDeputyComponent } from "./features/poc/confused-deputy/confused-deputy.component";
import { NamespacedSafeComponent } from "./features/poc/namespaced-safe/namespaced-safe.component";

export const routes: Routes = [
  { path: "poc/constructor-only/:key", component: ConstructorOnlyComponent },
  { path: "poc/proto-only/:key", component: ProtoOnlyComponent },
  {
    path: "poc/cache-poison/resource/:key",
    component: CachePoisonResourceComponent,
  },
  {
    path: "poc/cache-poison/rxresource/:key",
    component: CachePoisonRxResourceComponent,
  },
  { path: "poc/multi-request/:key", component: MultiRequestComponent },
  { path: "poc/confused-deputy/:key", component: ConfusedDeputyComponent },
  { path: "poc/namespaced-safe/:key", component: NamespacedSafeComponent },
  {
    path: "",
    pathMatch: "full",
    redirectTo: "poc/constructor-only/constructor",
  },
];
