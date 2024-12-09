const abi = [
  {
    constant: true,
    inputs: [],
    name: 'implementation',
    outputs: [{ name: 'codeAddr', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'proxyType',
    outputs: [{ name: 'proxyTypeId', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export default abi;
