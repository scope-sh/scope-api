const abi = [
  {
    constant: true,
    inputs: [],
    name: 'implementation',
    outputs: [{ name: 'impl', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export default abi;
