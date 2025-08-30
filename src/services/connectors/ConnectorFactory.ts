import { BaseConnector } from './BaseConnector';
import { BigBuyConnector } from './BigBuyConnector';
import { CdiscountConnector } from './CdiscountConnector';
import { SupplierCredentials, SupplierConnector } from '@/types/suppliers';

export class ConnectorFactory {
  private static connectorRegistry: Map<string, SupplierConnector> = new Map();

  static {
    // Register available connectors
    ConnectorFactory.registerConnector({
      id: 'bigbuy',
      name: 'BigBuy',
      displayName: 'BigBuy Dropshipping',
      description: 'Connect to BigBuy for wholesale products and dropshipping',
      category: 'dropshipping',
      authType: 'api_key',
      features: {
        products: true,
        inventory: true,
        orders: true,
        webhooks: false,
      },
      rateLimits: {
        requestsPerMinute: 40,
        requestsPerHour: 2000,
      },
    });

    ConnectorFactory.registerConnector({
      id: 'cdiscount',
      name: 'Cdiscount Pro',
      displayName: 'Cdiscount Marketplace',
      description: 'Connect to Cdiscount Pro for marketplace selling',
      category: 'marketplace',
      authType: 'oauth',
      features: {
        products: true,
        inventory: true,
        orders: false,
        webhooks: false,
      },
      rateLimits: {
        requestsPerMinute: 30,
        requestsPerHour: 1500,
      },
    });
  }

  static registerConnector(connector: SupplierConnector): void {
    ConnectorFactory.connectorRegistry.set(connector.id, connector);
  }

  static getAvailableConnectors(): SupplierConnector[] {
    return Array.from(ConnectorFactory.connectorRegistry.values());
  }

  static getConnector(connectorId: string): SupplierConnector | null {
    return ConnectorFactory.connectorRegistry.get(connectorId) || null;
  }

  static createConnectorInstance(
    connectorId: string,
    credentials: SupplierCredentials
  ): BaseConnector | null {
    switch (connectorId) {
      case 'bigbuy':
        return new BigBuyConnector(credentials);
      case 'cdiscount':
        return new CdiscountConnector(credentials);
      default:
        return null;
    }
  }

  static validateCredentials(
    connectorId: string,
    credentials: SupplierCredentials
  ): boolean {
    const connector = ConnectorFactory.getConnector(connectorId);
    if (!connector) return false;

    switch (connector.authType) {
      case 'api_key':
        return !!(credentials.apiKey);
      case 'oauth':
        return !!(credentials.accessToken);
      case 'credentials':
        return !!(credentials.username && credentials.password);
      case 'none':
        return true;
      default:
        return false;
    }
  }

  static getRequiredCredentialFields(connectorId: string): string[] {
    const connector = ConnectorFactory.getConnector(connectorId);
    if (!connector) return [];

    switch (connector.authType) {
      case 'api_key':
        return ['apiKey'];
      case 'oauth':
        return ['accessToken'];
      case 'credentials':
        return ['username', 'password'];
      case 'none':
        return [];
      default:
        return [];
    }
  }
}