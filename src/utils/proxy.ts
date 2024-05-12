import { zeroAddress, zeroHash } from 'viem';
import type { Address, Hex, PublicClient } from 'viem';

import eip897Abi from '@/abi/eip897Proxy.js';

// Storage slots for common proxy implementations
// Credit to @shazow for the original list
// https://github.com/shazow/whatsabi/blob/9cdb489da3360146382a180bd16f13458bdf36b1/src/proxies.ts
const slots: Record<string, Hex> = {
  // EIP-1967: Proxy Storage Slots
  // bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
  EIP1967_IMPL:
    '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',

  // EIP-1967
  // Beacon slot is a fallback if implementation is not set.
  // bytes32(uint256(keccak256('eip1967.proxy.beacon')) - 1)).
  // Beacon fallback has selectors:
  // - implementation()
  // - childImplementation()
  // - masterCopy() in Gnosis Safe
  // - comptrollerImplementation() in Compound
  EIP1967_BEACON:
    '0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50',

  // https://github.com/OpenZeppelin/openzeppelin-labs/blob/54ad91472fdd0ac4c34aa97d3a3da45c28245510/initializer_with_sol_editing/contracts/UpgradeabilityProxy.sol
  // bytes32(uint256(keccak256("org.zeppelinos.proxy.implementation")))
  ZEPPELINOS_IMPL:
    '0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3',

  // ERC-1822: Universal Upgradeable Proxy Standard (UUPS)
  // bytes32(uint256(keccak256("PROXIABLE")))
  PROXIABLE:
    '0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7',

  // Gnosis Safe Proxy Factor 1.1.1
  // Not actually a slot, but there's a PUSH32 to the masterCopy() selector
  // masterCopy value lives in the 0th slot on the contract
  GNOSIS_SAFE_SELECTOR:
    '0xa619486e00000000000000000000000000000000000000000000000000000000',

  // TODO
  // Diamond Proxy, as used by ZkSync Era contract
  // https://etherscan.io/address/0x32400084c286cf3e17e7b677ea9583e60a000324#code
  // keccak256("diamond.standard.diamond.storage") - 1;
  // DIAMOND_STORAGE: '0xc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131b',
};

async function getStorage(
  client: PublicClient,
  address: Address,
  slot: Hex,
): Promise<Hex | null> {
  if (!client) {
    return null;
  }
  const result = await client.getStorageAt({
    address: address as Address,
    slot: slot as Hex,
  });
  if (!result) {
    return null;
  }
  return result;
}

function getSlot(slots: Record<string, Hex>, name: string): Hex | null {
  if (name === 'GNOSIS_SAFE_SELECTOR') {
    return zeroHash;
  }
  const slot = slots[name];
  return slot || null;
}

// Attempts to get the proxy implementation address for a given address
// Note that this may not succeed even if the provided address is a proxy
async function getImplementation(
  client: PublicClient,
  address: Address,
): Promise<Address | null> {
  // EIP897: `implementation` method
  const callResults = await client.multicall({
    contracts: [
      {
        abi: eip897Abi,
        address: address as Address,
        functionName: 'implementation',
        args: [],
      },
    ],
  });
  const callResult = callResults[0];
  if (callResult.status === 'success') {
    const address = callResult.result.toLowerCase() as Address;
    if (address !== zeroAddress) {
      return address;
    }
  }
  // Try slot-based lookup
  for (const name in slots) {
    const slot = getSlot(slots, name);
    if (!slot) {
      continue;
    }
    const slotValue = await getStorage(client, address, slot);
    if (!slotValue) {
      continue;
    }
    if (slotValue === zeroHash) {
      continue;
    }
    // Convert to address
    const slotValueAddress = `0x${slotValue.slice(-40)}` as Address;
    return slotValueAddress;
  }
  return null;
}

// eslint-disable-next-line import/prefer-default-export
export { getImplementation };
