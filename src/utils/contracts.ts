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

export type { EVM, LANGUAGE, COMPILER, SourceCode };
