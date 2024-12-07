import { padHex, zeroAddress, zeroHash } from 'viem';
import type { Address, Hex, PublicClient } from 'viem';
import { getStorageAt, multicall } from 'viem/actions';

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

async function getByImplementationCall(
  client: PublicClient,
  address: Address,
): Promise<Address | null> {
  const results = await multicall(client, {
    contracts: [
      {
        address,
        abi: eip897ProxyAbi,
        functionName: 'implementation',
      },
    ],
  });
  const result = results[0];
  if (result.status === 'failure') {
    return null;
  }
  const implementation = result.result.toLowerCase() as Address;
  if (implementation === zeroAddress) {
    return null;
  }
  return implementation;
}

async function getByMasterCopyCall(
  client: PublicClient,
  address: Address,
): Promise<Address | null> {
  const results = await multicall(client, {
    contracts: [
      {
        address,
        abi: safeProxyAbi,
        functionName: 'masterCopy',
      },
    ],
  });
  const result = results[0];
  if (result.status === 'failure') {
    return null;
  }
  const implementation = result.result.toLowerCase() as Address;
  if (implementation === zeroAddress) {
    return null;
  }
  return implementation;
}

// Attempts to get the proxy implementation address for a given address
// Note that this may not succeed even if the provided address is a proxy
async function getImplementation(
  client: PublicClient,
  address: Address,
): Promise<Address | null> {
  // Call-based detection (Safe-like proxies)
  const masterCopy = await getByMasterCopyCall(client, address);
  if (masterCopy) {
    return masterCopy;
  }
  // Slot-based detection
  const slots = Object.values(slotMap);
  const addressSlot = padHex(address);
  slots.push(addressSlot);
  const slotValues = await Promise.all(
    slots.map((slot) => getStorageAt(client, { address, slot })),
  );
  for (const slot of slots) {
    const slotIndex = slots.indexOf(slot);
    const slotValue = slotValues[slotIndex];
    if (!slotValue) {
      continue;
    }
    const slotAddress = toAddress(slotValue);
    if (!slotAddress) {
      continue;
    }
    if (slot !== slotMap['EIP1967_BEACON']) {
      return slotAddress;
    }
    // Beacon proxies require a 2-step resolution
    const implementation = await getByImplementationCall(client, slotAddress);
    if (implementation) {
      return implementation;
    }
  }
  // Bytecode-based detection
  // Credit to @banteg for the original list
  // https://banteg.xyz/posts/minimal-proxies/
  // https://github.com/banteg/ape/blob/7c82b33c7b523e73dd1543dd2e5fe3d43a9af3f3/src/ape_ethereum/ecosystem.py#L249-L261
  const code = await client.getCode({ address });
  if (!code) {
    return null;
  }
  const patterns: RegExp[] = [
    // 'Minimal (ERC-1167)'
    /^0x363d3d373d3d3d363d73(.{40})5af43d82803e903d91602b57fd5bf3$/,
    // '0age'
    /^0x3d3d3d3d363d3d37363d73(.{40})5af43d3d93803e602a57fd5bf3$/,
    // 'Clones'
    /^0x36603057343d52307f830d2d700a97af574b186c80d40429385d24241565b08a7c559ba283a964d9b160203da23d3df35b3d3d3d3d363d3d37363d73(.{40})5af43d3d93803e605b57fd5bf3$/,
    // 'Vyper'
    /^0x366000600037611000600036600073(.{40})5af4602c57600080fd5b6110006000f3$/,
    // 'VyperBeta'
    /^0x366000600037611000600036600073(.{40})5af41558576110006000f3$/,
    // 'CWIA'
    /^0x3d3d3d3d363d3d3761.{4}603736393661.{4}013d73(.{40})5af43d3d93803e603557fd5bf3.*/,
    // 'OldCWIA'
    /^0x363d3d3761.{4}603836393d3d3d3661.{4}013d73(.{40})5af43d82803e903d91603657fd5bf3.*/,
    // 'SudoswapCWIA'
    /^0x3d3d3d3d363d3d37605160353639366051013d73(.{40})5af43d3d93803e603357fd5bf3.*/,
    // 'SoladyCWIA'
    /36602c57343d527f9e4ac34f21c619cefc926c8bd93b54bf5a39c7ab2127a895af1cc0691d7e3dff593da1005b363d3d373d3d3d3d61.{4}806062363936013d73(.{40})5af43d3d93803e606057fd5bf3.*/,
    // 'SplitsCWIA'
    /36602f57343d527f9e4ac34f21c619cefc926c8bd93b54bf5a39c7ab2127a895af1cc0691d7e3dff60203da13d3df35b3d3d3d3d363d3d3761.{4}606736393661.{4}013d73(.{40})5af43d3d93803e606557fd5bf3.*/,
    // 'SoladyPush0'
    /^0x5f5f365f5f37365f73(.{40})5af43d5f5f3e6029573d5ffd5b3d5ff3$/,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(code);
    if (match) {
      const firstMatch = match[1];
      if (!firstMatch) {
        continue;
      }
      const address = `0x${firstMatch}` as Address;
      return address;
    }
  }
  return null;
}

// eslint-disable-next-line import-x/prefer-default-export
export { getImplementation };
