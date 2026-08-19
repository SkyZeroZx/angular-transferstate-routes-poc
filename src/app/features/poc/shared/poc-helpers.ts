import {TransferState, makeStateKey} from '@angular/core';
import type {StateEvidence} from '../../../core/poc.models';

export interface PocUrls {
  fixedRecord: string;
  settingsMap: string;
  policy: string;
  guardedPolicy: string;
  bootstrap: string;
  profile: string;
  secret: string;
}

export function buildPocUrls(origin: string, rawKey: string): PocUrls {
  const key = encodeURIComponent(rawKey);
  return {
    fixedRecord: `${origin}/api/cms/fixed/${key}`,
    settingsMap: `${origin}/api/cms/settings-map/${key}`,
    policy: `${origin}/api/policy`,
    guardedPolicy: `${origin}/api/policy-guarded`,
    bootstrap: `${origin}/api/bootstrap`,
    profile: `${origin}/api/profile`,
    secret: `${origin}/api/admin-secret`,
  };
}

export function readAbsentKey(transferState: TransferState, keyText: string) {
  const key = makeStateKey<unknown>(keyText);
  const defaultValue = 'DEFAULT_VALUE';
  const value = transferState.get(key, defaultValue);
  return {
    hasKey: transferState.hasKey(key),
    returnedDefault: value === defaultValue,
    returnedType: typeof value,
    returnedTruthy: Boolean(value),
    functionName: typeof value === 'function' ? (value as Function).name : null,
  };
}

export function readKey(transferState: TransferState, keyText: string) {
  const key = makeStateKey<unknown>(keyText);
  const defaultValue = 'DEFAULT_VALUE';
  const value = transferState.get(key, defaultValue);
  return {
    hasKey: transferState.hasKey(key),
    returnedDefault: value === defaultValue,
    value,
  };
}

export function captureStateEvidence(transferState: TransferState): StateEvidence {
  const store = (transferState as unknown as {store: Record<string, unknown>}).store;
  const prototype = Object.getPrototypeOf(store) as Record<string, unknown> | null;
  return {
    prototypeMutated: prototype !== Object.prototype,
    prototypeKeys: prototype && prototype !== Object.prototype ? Object.keys(prototype) : [],
    hasOwnProto: Object.prototype.hasOwnProperty.call(store, '__proto__'),
    ownKeys: Object.keys(store),
    isEmpty: transferState.isEmpty,
    serialized: transferState.toJson(),
  };
}

export function json(value: unknown): string {
  return JSON.stringify(value ?? null, null, 2);
}
