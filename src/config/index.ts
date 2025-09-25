import dotenv from 'dotenv';
import { envSchema } from './validation.js';

dotenv.config();

// Validate environment variables
envSchema.parse(process.env);

export const AID = process.env.NFC_AID || 'F2222222222222'; // must match the AID in your Android app
export const GET = Buffer.from('80CA000000', 'hex'); // "GET_STRING" APDU
export const PAYMENT = Buffer.from('80CF000000', 'hex'); // "PAYMENT" APDU

// Recipient address should be configurable via environment
// Using a valid Substrate address format (SS58 encoded)
export const RECIPIENT_ADDRESS = process.env.RECIPIENT_ADDRESS || '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5';

// Validate recipient address format
if (!/^[1-9A-HJ-NP-Za-km-z]{32,48}$/.test(RECIPIENT_ADDRESS)) {
  throw new Error('Invalid RECIPIENT_ADDRESS format. Must be a valid Substrate address.');
}

export const COOLDOWN_DURATION = 30000; // 30 seconds cooldown after processing

export interface ChainConfig {
  id: number;
  name: string;
  displayName: string;
  rpcUrl: string;
  nativeToken: {
    symbol: string;
    name: string;
    decimals: number;
  };
  coingeckoId: string;
}

export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    id: 0,
    name: 'polkadot',
    displayName: 'Polkadot Relay Chain',
    rpcUrl: `https://polkadot-rpc.polkadot.io`,
    nativeToken: {
      symbol: 'DOT',
      name: 'Polkadot',
      decimals: 10
    },
    coingeckoId: 'polkadot'
  },
  {
    id: 2,
    name: 'kusama',
    displayName: 'Kusama Relay Chain',
    rpcUrl: `https://kusama-rpc.polkadot.io`,
    nativeToken: {
      symbol: 'KSM',
      name: 'Kusama',
      decimals: 12
    },
    coingeckoId: 'kusama'
  },
  {
    id: 1285,
    name: 'moonriver',
    displayName: 'Moonriver (Kusama)',
    rpcUrl: `https://rpc.api.moonriver.moonbeam.network`,
    nativeToken: {
      symbol: 'MOVR',
      name: 'Moonriver',
      decimals: 18
    },
    coingeckoId: 'moonriver'
  },
  {
    id: 336,
    name: 'shiden',
    displayName: 'Shiden (Kusama)',
    rpcUrl: `https://rpc.shiden.astar.network`,
    nativeToken: {
      symbol: 'SDN',
      name: 'Shiden',
      decimals: 18
    },
    coingeckoId: 'shiden'
  }
];

export const COINGECKO_API_BASE_URL = 'https://api.coingecko.com/api/v3';
