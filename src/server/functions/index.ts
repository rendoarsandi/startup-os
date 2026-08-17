import * as cfo from './cfo';
import * as marketing from './marketing';
import * as hr from './hr';
import * as operations from './operations';
import * as contracts from './contracts';
import * as chat from './chat';
import * as plaid from './plaid';
import * as seed from './seed';

export const api = {
  cfo,
  marketing,
  hr,
  operations,
  contracts,
  chat,
  plaid,
  seed,
};

export type Api = typeof api;
