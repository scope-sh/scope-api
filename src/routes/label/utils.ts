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
import { NamespaceId } from '@/utils/labels';

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

function getNamespaceIcon(namespaceId: NamespaceId): string | undefined {
  function getIconName(namespaceId: NamespaceId): string | undefined {
    switch (namespaceId) {
      case 'aave-v2':
      case 'aave-v3':
        return 'aave';
      case 'alchemy':
        return 'alchemy';
      case 'biconomy':
      case 'biconomy-v2':
        return 'biconomy';
      case 'blocto':
        return undefined;
      case 'candide':
        return undefined;
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
        return 'etherspot';
      case 'farcaster':
        return undefined;
      case 'fun':
        return 'fun';
      case 'light-v0.1':
      case 'light-v0.2':
        return 'light';
      case 'nani':
        return undefined;
      case 'opensea-seaport':
        return 'opensea';
      case 'parifi-v1':
        return undefined;
      case 'particle':
        return undefined;
      case 'patch-wallet':
        return undefined;
      case 'pimlico':
        return 'pimlico';
      case 'rhinestone-v1':
        return undefined;
      case 'safe-core':
      case 'safe':
        return 'safe';
      case 'stackup':
        return 'stackup';
      case 'unipass':
        return undefined;
      case 'uniswap-v2':
      case 'uniswap-v3':
        return 'uniswap';
      case 'zerodev':
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

export { getErc20Icon, getNamespaceIcon };
