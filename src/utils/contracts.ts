import { Hex } from 'viem';

type LANGUAGE = 'Solidity' | 'Vyper';
type COMPILER = 'solc' | 'vyper';
type EVM =
  | 'default'
  | 'byzantium'
  | 'constantinople'
  | 'petersburg'
  | 'istanbul'
  | 'berlin'
  | 'london'
  | 'shanghai'
  | 'istanbul';

interface SourceCode {
  name: string;
  entry: string;
  files: Record<string, string>;
  constructorArguments: string;
  evm: EVM;
  language: LANGUAGE;
  compiler: {
    type: COMPILER;
    version: string;
  };
  compilation: {
    optimization: {
      runs: number;
    } | null;
  };
}

interface Deployment {
  deployer: Hex;
  transactionHash: Hex;
}

export type { EVM, LANGUAGE, COMPILER, SourceCode, Deployment };
