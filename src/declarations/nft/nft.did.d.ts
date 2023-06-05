import type { Principal } from '@dfinity/principal';
export interface NFT {
  'getAsset' : () => Promise<Array<number>>,
  'getCannisterId' : () => Promise<Principal>,
  'getName' : () => Promise<string>,
  'getOwuner' : () => Promise<Principal>,
  'transferOwnership' : (arg_0: Principal) => Promise<string>,
}
export interface _SERVICE extends NFT {}
