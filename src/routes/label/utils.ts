import { getAddress } from 'viem';

import {
  ARBITRUM,
  ARBITRUM_SEPOLIA,
  BASE,
  BASE_SEPOLIA,
  ChainId,
  ETHEREUM,
  OPTIMISM,
  OPTIMISM_SEPOLIA,
  POLYGON,
  POLYGON_AMOY,
  SEPOLIA,
  MODE,
  MODE_SEPOLIA,
} from '@/utils/chains';
import {
  LabelType,
  LabelTypeId,
  LabelNamespace,
  LabelNamespaceId,
} from '@/utils/labels';

function getLabelTypeById(value: LabelTypeId): LabelType {
  function getLabelTypeValue(value: LabelTypeId): string {
    switch (value) {
      case 'erc20':
        return 'ERC20';
      case 'erc721':
        return 'ERC721';
      case 'erc1155':
        return 'ERC1155';
      case 'erc7579-module':
        return 'ERC7579 Module';
    }
  }

  return {
    id: value,
    value: getLabelTypeValue(value),
  };
}

function getNamespaceById(id: LabelNamespaceId): LabelNamespace {
  function getNamespaceValue(id: LabelNamespaceId): string {
    switch (id) {
      case 'aave-v2':
        return 'Aave V2';
      case 'aave-v3':
        return 'Aave V3';
      case 'aerodrome-v1':
        return 'Aerodrome V1';
      case 'alchemy':
        return 'Alchemy';
      case 'ambire':
        return 'Ambire';
      case 'biconomy':
        return 'Biconomy';
      case 'biconomy-v2':
        return 'Biconomy V2';
      case 'biconomy-nexus':
        return 'Biconomy Nexus';
      case 'blocto':
        return 'Blocto';
      case 'candide':
        return 'Candide';
      case 'cometh':
        return 'Cometh';
      case 'circle':
        return 'Circle';
      case 'coinbase':
        return 'Coinbase';
      case 'coinbase-smart-wallet':
        return 'Coinbase Smart Wallet';
      case 'daimo':
        return 'Daimo';
      case 'ethereum-attestation-service':
        return 'Ethereum Attestation Service';
      case 'ens':
        return 'ENS';
      case 'etherspot':
        return 'Etherspot';
      case 'etherspot-modular-v1':
        return 'Etherspot Modular V1';
      case 'farcaster':
        return 'Farcaster';
      case 'fun':
        return 'Fun';
      case 'klaster':
        return 'Klaster';
      case 'light':
        return 'Light';
      case 'lido':
        return 'Lido';
      case 'morpho':
        return 'Morpho';
      case 'nani':
        return 'Nani';
      case 'openfort':
        return 'Openfort';
      case 'opensea-seaport':
        return 'OpenSea Seaport';
      case 'parifi-v1':
        return 'Parifi V1';
      case 'particle':
        return 'Particle';
      case 'patch-wallet':
        return 'Patch Wallet';
      case 'pimlico':
        return 'Pimlico';
      case 'rhinestone-v1':
        return 'Rhinestone V1';
      case 'safe-core':
        return 'Safe Core';
      case 'safe':
        return 'Safe';
      case 'stackup':
        return 'Stackup';
      case 'thirdweb':
        return 'Thirdweb';
      case 'union':
        return 'Union';
      case 'unipass':
        return 'UniPass';
      case 'uniswap-v2':
        return 'Uniswap V2';
      case 'uniswap-v3':
        return 'Uniswap V3';
      case 'zerodev':
        return 'ZeroDev';
      case 'zerodev-kernel-v1':
        return 'ZeroDev Kernel V1';
      case 'zerodev-kernel-v2':
        return 'ZeroDev Kernel V2';
      case 'zerodev-kernel-v3':
        return 'ZeroDev Kernel V3';
      case 'zora':
        return 'Zora';
    }
  }

  return {
    id,
    value: getNamespaceValue(id),
  };
}

function getErc20Icon(chain: ChainId, address: string): string | undefined {
  function getChainName(chainId: ChainId): string | null {
    switch (chainId) {
      case ETHEREUM:
        return 'ethereum';
      case SEPOLIA:
        return null;
      case OPTIMISM:
        return 'optimism';
      case OPTIMISM_SEPOLIA:
        return null;
      case BASE:
        return 'base';
      case BASE_SEPOLIA:
        return null;
      case ARBITRUM:
        return 'arbitrum';
      case ARBITRUM_SEPOLIA:
        return null;
      case POLYGON:
        return 'polygon';
      case POLYGON_AMOY:
        return null;
      case MODE:
        return null;
      case MODE_SEPOLIA:
        return null;
    }
  }
  const chainName = getChainName(chain);
  if (!chainName) {
    return undefined;
  }
  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chainName}/assets/${getAddress(address)}/logo.png`;
}

function getNamespaceIcon(namespaceId: LabelNamespaceId): string | undefined {
  function getIconName(namespaceId: LabelNamespaceId): string | undefined {
    switch (namespaceId) {
      case 'aave-v2':
      case 'aave-v3':
        return 'aave';
      case 'aerodrome-v1':
        return 'aerodrome';
      case 'alchemy':
        return 'alchemy';
      case 'ambire':
        return 'ambire';
      case 'biconomy-nexus':
      case 'biconomy-v2':
      case 'biconomy':
        return 'biconomy';
      case 'blocto':
        return undefined;
      case 'candide':
        return undefined;
      case 'circle':
        return undefined;
      case 'coinbase-smart-wallet':
      case 'coinbase':
        return 'coinbase';
      case 'cometh':
        return 'cometh';
      case 'daimo':
        return 'daimo';
      case 'ens':
        return 'ens';
      case 'ethereum-attestation-service':
        return undefined;
      case 'etherspot-modular-v1':
      case 'etherspot':
        return 'etherspot';
      case 'farcaster':
        return undefined;
      case 'fun':
        return 'fun';
      case 'klaster':
        return 'klaster';
      case 'lido':
        return 'lido';
      case 'light':
        return 'light';
      case 'morpho':
        return 'morpho';
      case 'nani':
        return undefined;
      case 'openfort':
        return undefined;
      case 'opensea-seaport':
        return 'opensea';
      case 'parifi-v1':
        return undefined;
      case 'particle':
        return 'particle';
      case 'patch-wallet':
        return undefined;
      case 'pimlico':
        return 'pimlico';
      case 'rhinestone-v1':
        return 'rhinestone';
      case 'safe-core':
      case 'safe':
        return 'safe';
      case 'stackup':
        return 'stackup';
      case 'thirdweb':
        return 'thirdweb';
      case 'union':
        return 'union';
      case 'unipass':
        return undefined;
      case 'uniswap-v2':
      case 'uniswap-v3':
        return 'uniswap';
      case 'zerodev':
      case 'zerodev-kernel-v1':
      case 'zerodev-kernel-v2':
      case 'zerodev-kernel-v3':
        return 'zerodev';
      case 'zora':
        return 'zora';
    }
  }

  const iconName = getIconName(namespaceId);
  if (!iconName) {
    return undefined;
  }
  return `https://api.scope.sh/static/icons/${iconName}.svg`;
}

export { getLabelTypeById, getNamespaceById, getErc20Icon, getNamespaceIcon };
