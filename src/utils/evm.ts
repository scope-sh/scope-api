// eslint-disable-next-line import-x/no-extraneous-dependencies
import { AbiError } from 'abitype';
import { Hex, keccak256, slice, toHex } from 'viem';
import { formatAbiItem } from 'viem/utils';

function toErrorSelector(abi: AbiError): Hex {
  return slice(keccak256(toHex(formatAbiItem(abi))), 0, 4);
}

// eslint-disable-next-line import-x/prefer-default-export
export { toErrorSelector };
