import * as v from 'valibot';
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
  linea,
  arbitrumNova,
  celo,
  avalanche,
  avalancheFuji,
  gnosis,
  bsc,
  monadTestnet,
  megaethTestnet,
} from 'viem/chains';

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
const LINEA = linea.id;
const ARBITRUM_NOVA = arbitrumNova.id;
const CELO = celo.id;
const AVALANCHE = avalanche.id;
const AVALANCHE_FUJI = avalancheFuji.id;
const GNOSIS = gnosis.id;
const BSC = bsc.id;
const MONAD_TESTNET = monadTestnet.id;
const MEGAETH_TESTNET = megaethTestnet.id;

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
  LINEA,
  ARBITRUM_NOVA,
  CELO,
  AVALANCHE,
  AVALANCHE_FUJI,
  GNOSIS,
  BSC,
  MONAD_TESTNET,
  MEGAETH_TESTNET,
];

const chainSchema = v.union([
  v.literal(ETHEREUM.toString()),
  v.literal(SEPOLIA.toString()),
  v.literal(OPTIMISM.toString()),
  v.literal(OPTIMISM_SEPOLIA.toString()),
  v.literal(OPTIMISM.toString()),
  v.literal(BASE.toString()),
  v.literal(BASE_SEPOLIA.toString()),
  v.literal(POLYGON.toString()),
  v.literal(POLYGON_AMOY.toString()),
  v.literal(ARBITRUM.toString()),
  v.literal(ARBITRUM_SEPOLIA.toString()),
  v.literal(MODE.toString()),
  v.literal(LINEA.toString()),
  v.literal(ARBITRUM_NOVA.toString()),
  v.literal(CELO.toString()),
  v.literal(AVALANCHE.toString()),
  v.literal(AVALANCHE_FUJI.toString()),
  v.literal(GNOSIS.toString()),
  v.literal(BSC.toString()),
  v.literal(MONAD_TESTNET.toString()),
  v.literal(MEGAETH_TESTNET.toString()),
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
  | typeof LINEA
  | typeof ARBITRUM_NOVA
  | typeof CELO
  | typeof AVALANCHE
  | typeof AVALANCHE_FUJI
  | typeof GNOSIS
  | typeof BSC
  | typeof MONAD_TESTNET
  | typeof MEGAETH_TESTNET;

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
    case LINEA:
      return linea;
    case ARBITRUM_NOVA:
      return arbitrumNova;
    case CELO:
      return celo;
    case AVALANCHE:
      return avalanche;
    case AVALANCHE_FUJI:
      return avalancheFuji;
    case GNOSIS:
      return gnosis;
    case BSC:
      return bsc;
    case MONAD_TESTNET:
      return monadTestnet;
    case MEGAETH_TESTNET:
      return megaethTestnet;
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
  LINEA,
  ARBITRUM_NOVA,
  CELO,
  AVALANCHE,
  AVALANCHE_FUJI,
  GNOSIS,
  BSC,
  MONAD_TESTNET,
  MEGAETH_TESTNET,
  getChainData,
  parseChainId,
  chainSchema,
};
export type { ChainId };
