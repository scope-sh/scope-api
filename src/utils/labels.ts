import { Address } from 'viem';

import { type ChainId } from './chains.js';

type LabelId =
  | 'wrapped'
  | 'erc20'
  | 'erc721'
  | 'erc1155'
  | 'aave-v2-atoken'
  | 'aave-v2-variable-debt-token'
  | 'aave-v2-stable-debt-token'
  | 'aave-v3-atoken'
  | 'aave-v3-vtoken'
  | 'aave-v3-stoken'
  | 'biconomy-v2-account'
  | 'coinbase-smart-wallet-v1-account'
  | 'daimo-v1-account'
  | 'kernel-v2-account'
  | 'kernel-v3-account'
  | 'erc7579-module'
  | 'fun-v1-account'
  | 'light-v0.1-account'
  | 'light-v0.2-account'
  | 'patch-wallet-v1-account'
  | 'rhinestone-v1-module'
  | 'safe-v1.3.0-account'
  | 'safe-v1.4.1-account'
  | 'uniswap-v2-pool'
  | 'uniswap-v3-pool';

type NamespaceId =
  | 'aave-v2'
  | 'aave-v3'
  | 'alchemy'
  | 'biconomy'
  | 'biconomy-v2'
  | 'blocto'
  | 'candide'
  | 'circle'
  | 'coinbase-smart-wallet'
  | 'daimo'
  | 'ethereum-attestation-service'
  | 'ens'
  | 'etherspot'
  | 'farcaster'
  | 'fun'
  | 'light-v0.1'
  | 'light-v0.2'
  | 'nani'
  | 'opensea-seaport'
  | 'parifi-v1'
  | 'particle'
  | 'patch-wallet'
  | 'pimlico'
  | 'rhinestone-v1'
  | 'safe-core'
  | 'safe'
  | 'stackup'
  | 'unipass'
  | 'uniswap-v2'
  | 'uniswap-v3'
  | 'zerodev'
  | 'zerodev-kernel-v2'
  | 'zerodev-kernel-v3';

type ChainLabelMap = Record<Address, Label[]>;
type LabelMap = Record<ChainId, ChainLabelMap>;

interface LabelType {
  id: LabelId;
  value: string;
}

interface LabelNamespace {
  id: NamespaceId;
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
  LabelId,
  LabelType,
  LabelNamespace,
  LabelMap,
  NamespaceId,
};
