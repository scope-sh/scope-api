import { Chain as ChainData } from 'viem';
import {
  mainnet,
  sepolia,
  optimism,
  optimismSepolia,
  base,
  baseSepolia,
  polygon,
  polygonAmoy,
  arbitrum,
  arbitrumSepolia,
  mode,
  modeTestnet,
} from 'viem/chains';
import { z } from 'zod';

const ETHEREUM = mainnet.id;
const SEPOLIA = sepolia.id;
const OPTIMISM = optimism.id;
const OPTIMISM_SEPOLIA = optimismSepolia.id;
const POLYGON = polygon.id;
const POLYGON_AMOY = polygonAmoy.id;
const BASE = base.id;
const BASE_SEPOLIA = baseSepolia.id;
const ARBITRUM = arbitrum.id;
const ARBITRUM_SEPOLIA = arbitrumSepolia.id;
const MODE = mode.id;
const MODE_SEPOLIA = modeTestnet.id;

const CHAINS: ChainId[] = [
  ETHEREUM,
  SEPOLIA,
  OPTIMISM,
  OPTIMISM_SEPOLIA,
  POLYGON,
  POLYGON_AMOY,
  BASE,
  BASE_SEPOLIA,
  ARBITRUM,
  ARBITRUM_SEPOLIA,
  MODE,
  MODE_SEPOLIA,
];

const chainSchema = z.union([
  z.literal(ETHEREUM.toString()),
  z.literal(SEPOLIA.toString()),
  z.literal(OPTIMISM.toString()),
  z.literal(OPTIMISM_SEPOLIA.toString()),
  z.literal(OPTIMISM.toString()),
  z.literal(BASE.toString()),
  z.literal(BASE_SEPOLIA.toString()),
  z.literal(POLYGON.toString()),
  z.literal(POLYGON_AMOY.toString()),
  z.literal(ARBITRUM.toString()),
  z.literal(ARBITRUM_SEPOLIA.toString()),
  z.literal(MODE.toString()),
  z.literal(MODE_SEPOLIA.toString()),
]);

type ChainId =
  | typeof ETHEREUM
  | typeof SEPOLIA
  | typeof OPTIMISM
  | typeof OPTIMISM_SEPOLIA
  | typeof POLYGON
  | typeof POLYGON_AMOY
  | typeof BASE
  | typeof BASE_SEPOLIA
  | typeof ARBITRUM
  | typeof ARBITRUM_SEPOLIA
  | typeof MODE
  | typeof MODE_SEPOLIA;

function getChainData(chain: ChainId): ChainData {
  switch (chain) {
    case ETHEREUM:
      return mainnet;
    case SEPOLIA:
      return sepolia;
    case OPTIMISM:
      return optimism;
    case OPTIMISM_SEPOLIA:
      return optimismSepolia;
    case POLYGON:
      return polygon;
    case POLYGON_AMOY:
      return polygonAmoy;
    case BASE:
      return base;
    case BASE_SEPOLIA:
      return baseSepolia;
    case ARBITRUM:
      return arbitrum;
    case ARBITRUM_SEPOLIA:
      return arbitrumSepolia;
    case MODE:
      return mode;
    case MODE_SEPOLIA:
      return modeTestnet;
  }
}

function parseChainId(value: string): ChainId {
  return CHAINS.find((chain) => chain.toString() === value) ?? ETHEREUM;
}

export {
  CHAINS,
  ETHEREUM,
  SEPOLIA,
  OPTIMISM,
  OPTIMISM_SEPOLIA,
  POLYGON,
  POLYGON_AMOY,
  BASE,
  BASE_SEPOLIA,
  ARBITRUM,
  ARBITRUM_SEPOLIA,
  MODE,
  MODE_SEPOLIA,
  getChainData,
  parseChainId,
  chainSchema,
};
export type { ChainId };
