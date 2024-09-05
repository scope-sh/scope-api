import { padHex, zeroAddress, zeroHash } from 'viem';
import type { Address, Hex, PublicClient } from 'viem';

import eip897ProxyAbi from '@/abi/eip897Proxy.js';
import safeProxyAbi from '@/abi/safeProxy.js';

// Storage slots for common proxy implementations
// Credit to @shazow for the original list
// https://github.com/shazow/whatsabi/blob/9cdb489da3360146382a180bd16f13458bdf36b1/src/proxies.ts
const slotMap: Record<string, Hex> = {
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

  // TODO
  // Diamond Proxy, as used by ZkSync Era contract
  // https://etherscan.io/address/0x32400084c286cf3e17e7b677ea9583e60a000324#code
  // keccak256("diamond.standard.diamond.storage") - 1;
  // DIAMOND_STORAGE: '0xc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131b',
};

async function getStorage(
  client: PublicClient,
  address: Address,
  slots: Hex[],
): Promise<Hex[]> {
  const results = await Promise.all(
    slots.map((slot) => client.getStorageAt({ address, slot })),
  );
  return results.filter((result) => !!result);
}

function toAddress(slotValue: Hex | null): Address | null {
  if (!slotValue) {
    return null;
  }
  if (slotValue === zeroHash) {
    return null;
  }
  const address = `0x${slotValue.slice(-40)}` as Address;
  // First 12 bytes should be zero
  if (padHex(address) !== slotValue) {
    return null;
  }
  return address;
}

// Attempts to get the proxy implementation address for a given address
// Note that this may not succeed even if the provided address is a proxy
async function getImplementation(
  client: PublicClient,
  address: Address,
): Promise<Address | null> {
  if (isKnownNonProxy(address)) {
    return null;
  }
  // EIP897: `implementation` method
  const callResults = await client.multicall({
    contracts: [
      {
        abi: eip897ProxyAbi,
        address: address,
        functionName: 'implementation',
        args: [],
      },
      {
        abi: safeProxyAbi,
        address: address,
        functionName: 'masterCopy',
        args: [],
      },
    ],
  });
  const implementationResult = callResults[0];
  const masterCopyResult = callResults[1];
  if (implementationResult.status === 'success') {
    const address = implementationResult.result.toLowerCase() as Address;
    if (address !== zeroAddress) {
      return address;
    }
  }
  if (masterCopyResult.status === 'success') {
    const address = masterCopyResult.result.toLowerCase() as Address;
    if (address !== zeroAddress) {
      return address;
    }
  }
  const slots = Object.values(slotMap);
  const addressSlot = padHex(address);
  slots.push(addressSlot);
  const slotValues = await getStorage(client, address, slots);
  for (const slot of slotValues) {
    const slotAddress = toAddress(slot);
    if (slotAddress) {
      return slotAddress;
    }
  }
  return null;
}

function isKnownNonProxy(address: Address): boolean {
  return [
    '0x6723b44abeec4e71ebe3232bd5b455805badd22f', // ZeroDev Kernel Factory V3.0
    '0xaac5d4240af87249b3f71bc8e4a2cae074a3e419', // ZeroDev Kernel Factory V3.1
    '0x000000000000dd366cc2e4432bb998e41dfd47c7', // Nani Factory V0.0.0
    '0x0000000000008dd2574908774527fd6da397d75b', // Nani Factory V1.1.1
    '0x420dd381b31aef6683db6b902084cb0ffece40da', // Aerodrome Factory
    '0xf1046053aa5682b4f9a81b5481394da16be5ff5a', // Velodrome Factory V2
    '0x0ba5ed0c6aa8c49038f819e587e2633c4a9f428a', // Coinbase Smart Wallet Factory
  ].includes(address);
}

export { getImplementation, isKnownNonProxy };
