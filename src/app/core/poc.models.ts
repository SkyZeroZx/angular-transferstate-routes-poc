export type CaseId =
  | 'constructor-only'
  | 'proto-only'
  | 'cache-poison-resource'
  | 'cache-poison-rxresource'
  | 'multi-request'
  | 'confused-deputy'
  | 'namespaced-safe';

export interface Policy {
  allowed: boolean;
  role: string;
  tenant: string;
  signed: boolean;
  source: string;
}

export interface BootstrapConfig {
  tenant: string;
  internalFeature: string | null;
  signed: boolean;
  source: string;
}

export interface Profile {
  name: string;
  plan: string;
  signed: boolean;
  source: string;
}

export interface SecretResponse {
  authorized: boolean;
  tenant: string;
  secret: string;
}

export interface StateEvidence {
  prototypeMutated: boolean;
  prototypeKeys: string[];
  hasOwnProto: boolean;
  ownKeys: string[];
  isEmpty: boolean;
  serialized: string;
}
