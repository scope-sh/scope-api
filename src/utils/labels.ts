import { Address } from 'viem';

import { type ChainId } from './chains.js';

type LabelType =
  | 'wrapped'
  | 'erc20'
  | 'aave-v2-atoken'
  | 'aave-v2-variable-debt-token'
  | 'aave-v2-stable-debt-token'
  | 'aave-v3-atoken'
  | 'aave-v3-vtoken'
  | 'aave-v3-stoken';

type ChainLabelMap = Record<string, Label>;
type LabelMap = Record<ChainId, ChainLabelMap>;

interface Label {
  value: Address;
  namespace?: string;
  type?: LabelType;
  metadata?: Record<string, unknown>;
}

export type { ChainLabelMap, Label, LabelType, LabelMap };
