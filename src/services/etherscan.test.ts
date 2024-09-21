import { describe, it, expect } from 'bun:test';

import { parseSource } from './etherscan.js';

const CONTRACT_A = 'contract A {};';
const CONTRACT_B = 'contract B { uint256 a = 42; };';
const FILE_PATH_A = 'contracts/A.sol';
const FILE_PATH_B = 'contracts/B.sol';

describe('Etherscan', () => {
  describe('parseSource', () => {
    it('should parse single-file code', () => {
      // Example: 0xf4321ce3cce6d85fc6e426b0b54af6b420b5c635 on Base
      const sourceString = CONTRACT_A;
      const source = parseSource(sourceString);
      expect(source).not.toBeNull();
      if (!source) {
        return;
      }
      expect(Object.keys(source.sources).length).toEqual(1);
      const path = Object.keys(source.sources)[0];
      if (!path) {
        return;
      }
      const file = source.sources[path];
      if (!file) {
        return;
      }
      expect(file.content).toEqual(CONTRACT_A);
    });

    it('should parse multi-file source-only code', () => {
      // Example: 0x4e1dcf7ad4e460cfd30791ccc4f9c8a4f820ec67 on Base
      const sourceString = `{"${FILE_PATH_A}":{"content": "${CONTRACT_A}"}, "${FILE_PATH_B}":{"content": "${CONTRACT_B}"}}`;
      const source = parseSource(sourceString);
      expect(source).not.toBeNull();
      if (!source) {
        return;
      }
      expect(Object.keys(source.sources).length).toEqual(2);
      const filePathA = Object.keys(source.sources)[0];
      if (!filePathA) {
        return;
      }
      expect(filePathA).toEqual(FILE_PATH_A);
      const fileA = source.sources[filePathA];
      if (!fileA) {
        return;
      }
      expect(fileA.content).toEqual(CONTRACT_A);

      const filePathB = Object.keys(source.sources)[1];
      if (!filePathB) {
        return;
      }
      expect(filePathB).toEqual(FILE_PATH_B);
      const fileB = source.sources[filePathB];
      if (!fileB) {
        return;
      }
      expect(fileB.content).toEqual(CONTRACT_B);
    });

    it('should parse multi-file source-and-metadata code', () => {
      // Example: 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913 on Base
      const sourceString = `{{"language": "Solidity", "sources": {"${FILE_PATH_A}":{"content": "${CONTRACT_A}"}, "${FILE_PATH_B}":{"content": "${CONTRACT_B}"}}}}`;
      const source = parseSource(sourceString);
      expect(source).not.toBeNull();
      if (!source) {
        return;
      }
      expect(Object.keys(source.sources).length).toEqual(2);
      const filePathA = Object.keys(source.sources)[0];
      if (!filePathA) {
        return;
      }
      expect(filePathA).toEqual(FILE_PATH_A);
      const fileA = source.sources[filePathA];
      if (!fileA) {
        return;
      }
      expect(fileA.content).toEqual(CONTRACT_A);

      const filePathB = Object.keys(source.sources)[1];
      if (!filePathB) {
        return;
      }
      expect(filePathB).toEqual(FILE_PATH_B);
      const fileB = source.sources[filePathB];
      if (!fileB) {
        return;
      }
      expect(fileB.content).toEqual(CONTRACT_B);
    });
  });
});
