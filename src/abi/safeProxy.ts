const abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_singleton',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    stateMutability: 'payable',
    type: 'fallback',
  },
  {
    constant: true,
    inputs: [],
    name: 'masterCopy',
    outputs: [{ name: 'impl', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export default abi;
