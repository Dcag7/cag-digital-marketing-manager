import 'server-only';
import { decryptJson } from '@/lib/encryption';
import { prisma } from '@/lib/db';

interface ShopifyTokenData {
  access_token: string;
  scope: string;
  shop_domain: string;
}

export async function getShopifyAccessToken(workspaceId: string): Promise<{ token: string; shopDomain: string }> {
  const secret = await prisma.encryptedSecret.findUnique({
    where: {
      workspaceId_integrationType: {
        workspaceId,
        integrationType: 'SHOPIFY',
      },
    },
  });

  if (!secret) {
    throw new Error('Shopify integration not connected');
  }

  const tokenData = decryptJson<ShopifyTokenData>(secret.encryptedJson);
  return {
    token: tokenData.access_token,
    shopDomain: tokenData.shop_domain,
  };
}

export async function fetchShopifyAPI<T>(
  workspaceId: string,
  endpoint: string,
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: object;
  }
): Promise<T> {
  const { token, shopDomain } = await getShopifyAccessToken(workspaceId);
  
  const response = await fetch(
    `https://${shopDomain}/admin/api/2024-01/${endpoint}`,
    {
      method: options?.method || 'GET',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Shopify API error: ${response.status} ${error}`);
  }

  return response.json();
}

export async function syncShopifyShop(workspaceId: string): Promise<void> {
  const { shopDomain } = await getShopifyAccessToken(workspaceId);
  
  const data = await fetchShopifyAPI<{ shop: { name: string; currency: string } }>(
    workspaceId,
    'shop.json'
  );

  await prisma.shopifyShop.upsert({
    where: {
      workspaceId_shopDomain: {
        workspaceId,
        shopDomain,
      },
    },
    create: {
      id: `${workspaceId}_${shopDomain}`,
      workspaceId,
      shopDomain,
      name: data.shop.name,
      currency: data.shop.currency || 'ZAR',
    },
    update: {
      name: data.shop.name,
      currency: data.shop.currency || 'ZAR',
    },
  });
}

interface ShopifyOrder {
  id: number;
  name: string;
  total_price: string;
  currency: string;
  created_at: string;
  line_items: Array<{
    id: number;
    product_id: number | null;
    variant_id: number | null;
    quantity: number;
    price: string;
    title: string;
  }>;
}

export async function syncShopifyOrders(workspaceId: string, days: number = 7): Promise<void> {
  const { shopDomain } = await getShopifyAccessToken(workspaceId);
  
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);
  
  let pageInfo: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const endpoint = pageInfo
      ? `orders.json?page_info=${pageInfo}&limit=250`
      : `orders.json?created_at_min=${sinceDate.toISOString()}&status=any&limit=250`;

    const data = await fetchShopifyAPI<{ orders: ShopifyOrder[] }>(
      workspaceId,
      endpoint
    );

    for (const order of data.orders) {
      const orderId = order.id.toString();

      await prisma.shopifyOrder.upsert({
        where: {
          workspaceId_orderId: {
            workspaceId,
            orderId,
          },
        },
        create: {
          id: `${workspaceId}_${orderId}`,
          workspaceId,
          shopDomain,
          orderId,
          orderNumber: order.name,
          totalPrice: parseFloat(order.total_price),
          currency: order.currency,
          createdAt: new Date(order.created_at),
        },
        update: {
          totalPrice: parseFloat(order.total_price),
          currency: order.currency,
        },
      });

      // Sync line items
      for (const item of order.line_items) {
        const lineItemId = item.id.toString();

        await prisma.shopifyOrderLineItem.upsert({
          where: {
            id: `${workspaceId}_${orderId}_${lineItemId}`,
          },
          create: {
            id: `${workspaceId}_${orderId}_${lineItemId}`,
            workspaceId,
            orderId,
            lineItemId,
            productId: item.product_id?.toString() || null,
            variantId: item.variant_id?.toString() || null,
            quantity: item.quantity,
            price: parseFloat(item.price),
            title: item.title,
          },
          update: {
            quantity: item.quantity,
            price: parseFloat(item.price),
            title: item.title,
          },
        });
      }
    }

    // Check for pagination (Shopify uses Link header)
    // For simplicity, we'll break after first page in this implementation
    // A full implementation would parse the Link header
    hasNextPage = false;
  }
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  status: string;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    sku: string | null;
    inventory_quantity: number;
    available: boolean;
  }>;
}

export async function syncShopifyProducts(workspaceId: string): Promise<void> {
  const { shopDomain } = await getShopifyAccessToken(workspaceId);
  
  let pageInfo: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const endpoint = pageInfo
      ? `products.json?page_info=${pageInfo}&limit=250`
      : `products.json?limit=250`;

    const data = await fetchShopifyAPI<{ products: ShopifyProduct[] }>(
      workspaceId,
      endpoint
    );

    for (const product of data.products) {
      const productId = product.id.toString();

      await prisma.shopifyProduct.upsert({
        where: {
          workspaceId_productId: {
            workspaceId,
            productId,
          },
        },
        create: {
          id: `${workspaceId}_${productId}`,
          workspaceId,
          shopDomain,
          productId,
          title: product.title,
          handle: product.handle,
          status: product.status,
        },
        update: {
          title: product.title,
          handle: product.handle,
          status: product.status,
        },
      });

      // Sync variants
      for (const variant of product.variants) {
        const variantId = variant.id.toString();

        await prisma.shopifyVariant.upsert({
          where: {
            workspaceId_variantId: {
              workspaceId,
              variantId,
            },
          },
          create: {
            id: `${workspaceId}_${variantId}`,
            workspaceId,
            productId,
            variantId,
            title: variant.title,
            price: parseFloat(variant.price),
            sku: variant.sku,
            inventoryQuantity: variant.inventory_quantity,
            available: variant.available,
          },
          update: {
            title: variant.title,
            price: parseFloat(variant.price),
            sku: variant.sku,
            inventoryQuantity: variant.inventory_quantity,
            available: variant.available,
          },
        });
      }
    }

    // For simplicity, break after first page
    hasNextPage = false;
  }
}

export async function syncShopifyAll(workspaceId: string, days: number = 7): Promise<void> {
  await syncShopifyShop(workspaceId);
  await syncShopifyOrders(workspaceId, days);
  await syncShopifyProducts(workspaceId);
}
