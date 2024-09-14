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
      case 'aave-v2-atoken':
        return 'Aave V2 aToken';
      case 'aave-v2-variable-debt-token':
        return 'Aave V2 Variable Debt Token';
      case 'aave-v2-stable-debt-token':
        return 'Aave V2 Stable Debt Token';
      case 'aave-v3-atoken':
        return 'Aave V3 aToken';
      case 'aave-v3-vtoken':
        return 'Aave V3 vToken';
      case 'aave-v3-stoken':
        return 'Aave V3 sToken';
      case 'aerodrome-v1-pool':
        return 'Aerodrome V1 Pool';
      case 'alchemy-v1-multi-owner-modular-account':
        return 'Alchemy V1 Multi Owner Modular Account';
      case 'alchemy-v1.0-light-account':
        return 'Alchemy V1.0 Light Account';
      case 'alchemy-v1.1-light-account':
        return 'Alchemy V1.1 Light Account';
      case 'alchemy-v2-light-account':
        return 'Alchemy V2 Light Account';
      case 'alchemy-v2-multi-owner-light-account':
        return 'Alchemy V2 Multi Owner Light Account';
      case 'biconomy-v2-account':
        return 'Biconomy V2 Account';
      case 'coinbase-smart-wallet-v1-account':
        return 'Coinbase Smart Wallet V1 Account';
      case 'daimo-v1-account':
        return 'Daimo V1 Account';
      case 'kernel-v1-account':
        return 'Kernel V1 Account';
      case 'kernel-v2-account':
        return 'Kernel V2 Account';
      case 'kernel-v3-account':
        return 'Kernel V3 Account';
      case 'entry-point-v0.6.0-account':
        return 'Entry Point V0.6.0 Account';
      case 'entry-point-v0.7.0-account':
        return 'Entry Point V0.7.0 Account';
      case 'etherspot-modular-v1-account':
        return 'Etherspot Modular V1 Account';
      case 'erc7579-module':
        return 'ERC7579 Module';
      case 'fun-v1-account':
        return 'Fun Account';
      case 'light-account':
        return 'Light Account';
      case 'morpho-vault':
        return 'Morpho Vault';
      case 'nani-v0-account':
        return 'Nani V0 Account';
      case 'nani-v1-account':
        return 'Nani V1 Account';
      case 'patch-wallet-v1-account':
        return 'Patch Wallet Account';
      case 'rhinestone-v1-module':
        return 'Rhinestone V1 Module';
      case 'safe7579-v1.0.0-account':
        return 'Safe7579 V1.0.0 Account';
      case 'safe-v1.3.0-account':
        return 'Safe V1.3.0 Account';
      case 'safe-v1.4.1-account':
        return 'Safe V1.4.1 Account';
      case 'thirdweb-v1-managed-account':
        return 'Thirdweb V1 Managed Account';
      case 'uniswap-v2-pool':
        return 'Uniswap V2 Pool';
      case 'uniswap-v3-pool':
        return 'Uniswap V3 Pool';
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
      case 'biconomy':
        return 'Biconomy';
      case 'biconomy-v2':
        return 'Biconomy V2';
      case 'blocto':
        return 'Blocto';
      case 'candide':
        return 'Candide';
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
      case 'biconomy':
      case 'biconomy-v2':
        return 'biconomy';
      case 'blocto':
        return undefined;
      case 'candide':
        return undefined;
      case 'coinbase':
      case 'coinbase-smart-wallet':
        return 'coinbase';
      case 'circle':
        return undefined;
      case 'daimo':
        return 'daimo';
      case 'ens':
        return 'ens';
      case 'ethereum-attestation-service':
        return undefined;
      case 'etherspot':
      case 'etherspot-modular-v1':
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
    }
  }

  const iconName = getIconName(namespaceId);
  if (!iconName) {
    return undefined;
  }
  return `https://api.scope.sh/static/icons/${iconName}.svg`;
}

export { getLabelTypeById, getNamespaceById, getErc20Icon, getNamespaceIcon };
