import { Address } from 'viem';

import { type ChainId } from './chains.js';

type LabelTypeId = 'erc20' | 'erc721' | 'erc1155' | 'erc7579-module';

type LabelNamespaceId =
  | 'aave-v2'
  | 'aave-v3'
  | 'aerodrome-v1'
  | 'alchemy'
  | 'ambire'
  | 'biconomy-nexus'
  | 'biconomy-v2'
  | 'biconomy'
  | 'blocto'
  | 'candide'
  | 'circle'
  | 'coinbase-smart-wallet'
  | 'coinbase'
  | 'cometh'
  | 'daimo'
  | 'ens'
  | 'ethereum-attestation-service'
  | 'etherspot-modular-v1'
  | 'etherspot'
  | 'farcaster'
  | 'fun'
  | 'klaster'
  | 'lido'
  | 'light'
  | 'morpho'
  | 'nani'
  | 'openfort'
  | 'opensea-seaport'
  | 'parifi-v1'
  | 'particle'
  | 'patch-wallet'
  | 'pimlico'
  | 'rhinestone-v1'
  | 'safe-core'
  | 'safe'
  | 'stackup'
  | 'thirdweb'
  | 'union'
  | 'unipass'
  | 'uniswap-v2'
  | 'uniswap-v3'
  | 'zerodev-kernel-v1'
  | 'zerodev-kernel-v2'
  | 'zerodev-kernel-v3'
  | 'zerodev'
  | 'zora';

type ChainLabelMap = Record<Address, Label[]>;
type LabelMap = Record<ChainId, ChainLabelMap>;

interface LabelType {
  id: LabelTypeId;
  value: string;
}

interface LabelNamespace {
  id: LabelNamespaceId;
  value: string;
}

interface Label {
  value: string;
  namespace?: LabelNamespace;
  type?: LabelType;
  iconUrl: string | undefined;
  metadata?: Record<string, unknown>;
}

export type {
  ChainLabelMap,
  Label,
  LabelTypeId,
  LabelType,
  LabelNamespaceId,
  LabelNamespace,
  LabelMap,
};
