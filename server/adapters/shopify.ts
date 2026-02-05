import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';

// Shopify API helper
async function getShopifyCredentials(workspaceId: string) {
  const secret = await prisma.encryptedSecret.findUnique({
    where: {
      workspaceId_integrationType: {
        workspaceId,
        integrationType: 'SHOPIFY',
      },
    },
  });

  if (!secret) {
    throw new Error('Shopify not connected');
  }

  const decrypted = decrypt(secret.encryptedJson);
  const credentials = JSON.parse(decrypted);
  
  return {
    shopDomain: credentials.shopDomain,
    accessToken: credentials.accessToken,
  };
}

async function fetchShopifyAPI(
  shopDomain: string,
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
) {
  const url = `https://${shopDomain}/admin/api/2024-01/${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Shopify API error: ${response.status}`, errorText);
    throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// GraphQL helper for Shopify
async function fetchShopifyGraphQL(
  shopDomain: string,
  accessToken: string,
  query: string,
  variables: Record<string, unknown> = {}
) {
  const url = `https://${shopDomain}/admin/api/2024-01/graphql.json`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Shopify GraphQL error: ${response.status}`, errorText);
    throw new Error(`Shopify GraphQL error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    console.error('Shopify GraphQL errors:', data.errors);
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  return data.data;
}

// Sync shop info
export async function syncShopifyShop(workspaceId: string) {
  const { shopDomain, accessToken } = await getShopifyCredentials(workspaceId);
  
  const data = await fetchShopifyAPI(shopDomain, accessToken, 'shop.json');
  const shop = data.shop;

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
      name: shop.name,
      currency: shop.currency || 'ZAR',
    },
    update: {
      name: shop.name,
      currency: shop.currency || 'ZAR',
    },
  });

  console.log(`Synced Shopify shop: ${shop.name}`);
  return shop;
}

// Sync orders
export async function syncShopifyOrders(workspaceId: string, days: number = 90) {
  const { shopDomain, accessToken } = await getShopifyCredentials(workspaceId);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  let pageInfo: string | null = null;
  let hasNextPage = true;
  let totalOrders = 0;

  while (hasNextPage) {
    const params = new URLSearchParams({
      limit: '250',
      status: 'any',
      created_at_min: startDate.toISOString(),
    });
    
    if (pageInfo) {
      params.set('page_info', pageInfo);
    }

    const data = await fetchShopifyAPI(
      shopDomain,
      accessToken,
      `orders.json?${params.toString()}`
    );

    const orders = data.orders || [];
    
    for (const order of orders) {
      await prisma.shopifyOrder.upsert({
        where: {
          workspaceId_orderId: {
            workspaceId,
            orderId: order.id.toString(),
          },
        },
        create: {
          id: `${workspaceId}_${order.id}`,
          workspaceId,
          shopDomain,
          orderId: order.id.toString(),
          orderNumber: order.order_number.toString(),
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
      for (const item of order.line_items || []) {
        await prisma.shopifyOrderLineItem.upsert({
          where: {
            id: `${workspaceId}_${order.id}_${item.id}`,
          },
          create: {
            id: `${workspaceId}_${order.id}_${item.id}`,
            workspaceId,
            orderId: order.id.toString(),
            lineItemId: item.id.toString(),
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

      totalOrders++;
    }

    // Check for pagination
    hasNextPage = orders.length === 250;
    if (hasNextPage && data.link) {
      // Parse the Link header for pagination
      const match = data.link?.match(/page_info=([^>]+)>; rel="next"/);
      pageInfo = match ? match[1] : null;
      hasNextPage = !!pageInfo;
    } else {
      hasNextPage = false;
    }
  }

  console.log(`Synced ${totalOrders} Shopify orders`);
  return totalOrders;
}

// Sync products
export async function syncShopifyProducts(workspaceId: string) {
  const { shopDomain, accessToken } = await getShopifyCredentials(workspaceId);
  
  let pageInfo: string | null = null;
  let hasNextPage = true;
  let totalProducts = 0;

  while (hasNextPage) {
    const params = new URLSearchParams({
      limit: '250',
    });
    
    if (pageInfo) {
      params.set('page_info', pageInfo);
    }

    const data = await fetchShopifyAPI(
      shopDomain,
      accessToken,
      `products.json?${params.toString()}`
    );

    const products = data.products || [];
    
    for (const product of products) {
      await prisma.shopifyProduct.upsert({
        where: {
          workspaceId_productId: {
            workspaceId,
            productId: product.id.toString(),
          },
        },
        create: {
          id: `${workspaceId}_${product.id}`,
          workspaceId,
          shopDomain,
          productId: product.id.toString(),
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
      for (const variant of product.variants || []) {
        await prisma.shopifyVariant.upsert({
          where: {
            workspaceId_variantId: {
              workspaceId,
              variantId: variant.id.toString(),
            },
          },
          create: {
            id: `${workspaceId}_${variant.id}`,
            workspaceId,
            productId: product.id.toString(),
            variantId: variant.id.toString(),
            title: variant.title,
            price: parseFloat(variant.price),
            sku: variant.sku,
            inventoryQuantity: variant.inventory_quantity,
            available: variant.inventory_quantity > 0,
          },
          update: {
            title: variant.title,
            price: parseFloat(variant.price),
            sku: variant.sku,
            inventoryQuantity: variant.inventory_quantity,
            available: variant.inventory_quantity > 0,
          },
        });
      }

      totalProducts++;
    }

    hasNextPage = products.length === 250;
    if (!hasNextPage) break;
  }

  console.log(`Synced ${totalProducts} Shopify products`);
  return totalProducts;
}

// Sync email campaigns (using Shopify Marketing Activities API)
export async function syncShopifyEmailCampaigns(workspaceId: string, days: number = 90) {
  const { shopDomain, accessToken } = await getShopifyCredentials(workspaceId);
  
  // Shopify uses GraphQL for marketing activities
  const query = `
    query getMarketingActivities($first: Int!, $after: String) {
      marketingActivities(first: $first, after: $after, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            title
            status
            activityType
            marketingChannel
            scheduledToEndAt
            startedAt
            createdAt
            updatedAt
            ... on MarketingActivityEmail {
              subject
              previewText
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
        }
      }
    }
  `;

  let hasNextPage = true;
  let cursor: string | null = null;
  let totalCampaigns = 0;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    while (hasNextPage) {
      const data = await fetchShopifyGraphQL(shopDomain, accessToken, query, {
        first: 50,
        after: cursor,
      });

      const activities = data.marketingActivities?.edges || [];
      
      for (const { node: activity, cursor: activityCursor } of activities) {
        cursor = activityCursor;
        
        // Only sync email activities
        if (activity.marketingChannel !== 'EMAIL') continue;
        
        // Check date range
        const createdAt = new Date(activity.createdAt);
        if (createdAt < startDate) {
          hasNextPage = false;
          break;
        }

        // Map activity type to our enum
        let type: 'NEWSLETTER' | 'PROMOTIONAL' | 'ABANDONED_CART' | 'WELCOME_SERIES' | 'WIN_BACK' | 'POST_PURCHASE' | 'CUSTOM' = 'CUSTOM';
        const activityType = activity.activityType?.toLowerCase() || '';
        
        if (activityType.includes('newsletter')) type = 'NEWSLETTER';
        else if (activityType.includes('promotional') || activityType.includes('sale')) type = 'PROMOTIONAL';
        else if (activityType.includes('abandoned') || activityType.includes('cart')) type = 'ABANDONED_CART';
        else if (activityType.includes('welcome')) type = 'WELCOME_SERIES';
        else if (activityType.includes('win_back') || activityType.includes('winback')) type = 'WIN_BACK';
        else if (activityType.includes('post_purchase') || activityType.includes('thank')) type = 'POST_PURCHASE';

        // Extract the numeric ID from the GraphQL ID
        const campaignId = activity.id.split('/').pop() || activity.id;

        await prisma.shopifyEmailCampaign.upsert({
          where: {
            workspaceId_campaignId: {
              workspaceId,
              campaignId,
            },
          },
          create: {
            workspaceId,
            shopDomain,
            campaignId,
            name: activity.title || 'Untitled Campaign',
            type,
            status: activity.status?.toLowerCase() || 'draft',
            subject: activity.subject || null,
            previewText: activity.previewText || null,
            sentAt: activity.startedAt ? new Date(activity.startedAt) : null,
            scheduledAt: activity.scheduledToEndAt ? new Date(activity.scheduledToEndAt) : null,
          },
          update: {
            name: activity.title || 'Untitled Campaign',
            status: activity.status?.toLowerCase() || 'draft',
            subject: activity.subject || null,
            previewText: activity.previewText || null,
            sentAt: activity.startedAt ? new Date(activity.startedAt) : null,
          },
        });

        totalCampaigns++;
      }

      hasNextPage = data.marketingActivities?.pageInfo?.hasNextPage && hasNextPage;
    }
  } catch (error) {
    // If Marketing Activities API is not available, try alternative approach
    console.log('Marketing Activities API not available, trying alternative...');
    
    // Fallback: Get email campaigns from Shopify Email app if installed
    try {
      await syncShopifyEmailFromApp(workspaceId, shopDomain, accessToken, days);
    } catch (fallbackError) {
      console.log('Shopify Email app not available:', fallbackError);
    }
  }

  console.log(`Synced ${totalCampaigns} Shopify email campaigns`);
  return totalCampaigns;
}

// Alternative: Sync from Shopify Email app
async function syncShopifyEmailFromApp(
  workspaceId: string,
  shopDomain: string,
  accessToken: string,
  days: number
) {
  // Shopify Email campaigns via the shopifyEmail query
  const query = `
    query getEmailCampaigns($first: Int!) {
      shopifyEmail {
        campaigns(first: $first) {
          edges {
            node {
              id
              name
              status
              createdAt
              sentAt
              metrics {
                delivered
                opened
                clicked
                bounced
                unsubscribed
                spamReports
              }
            }
          }
        }
      }
    }
  `;

  try {
    const data = await fetchShopifyGraphQL(shopDomain, accessToken, query, {
      first: 100,
    });

    const campaigns = data.shopifyEmail?.campaigns?.edges || [];
    
    for (const { node: campaign } of campaigns) {
      const campaignId = campaign.id.split('/').pop() || campaign.id;
      
      await prisma.shopifyEmailCampaign.upsert({
        where: {
          workspaceId_campaignId: {
            workspaceId,
            campaignId,
          },
        },
        create: {
          workspaceId,
          shopDomain,
          campaignId,
          name: campaign.name || 'Untitled Campaign',
          type: 'NEWSLETTER',
          status: campaign.status?.toLowerCase() || 'draft',
          sentAt: campaign.sentAt ? new Date(campaign.sentAt) : null,
        },
        update: {
          name: campaign.name || 'Untitled Campaign',
          status: campaign.status?.toLowerCase() || 'draft',
          sentAt: campaign.sentAt ? new Date(campaign.sentAt) : null,
        },
      });

      // Sync metrics if available
      if (campaign.metrics && campaign.sentAt) {
        const date = new Date(campaign.sentAt);
        date.setHours(0, 0, 0, 0);

        await prisma.shopifyEmailMetrics.upsert({
          where: {
            workspaceId_campaignId_date: {
              workspaceId,
              campaignId,
              date,
            },
          },
          create: {
            workspaceId,
            campaignId,
            date,
            delivered: campaign.metrics.delivered || 0,
            opened: campaign.metrics.opened || 0,
            clicked: campaign.metrics.clicked || 0,
            bounced: campaign.metrics.bounced || 0,
            unsubscribed: campaign.metrics.unsubscribed || 0,
            spamReports: campaign.metrics.spamReports || 0,
          },
          update: {
            delivered: campaign.metrics.delivered || 0,
            opened: campaign.metrics.opened || 0,
            clicked: campaign.metrics.clicked || 0,
            bounced: campaign.metrics.bounced || 0,
            unsubscribed: campaign.metrics.unsubscribed || 0,
            spamReports: campaign.metrics.spamReports || 0,
          },
        });
      }
    }
  } catch (error) {
    console.log('Shopify Email query not available:', error);
  }
}

// Full sync function
export async function syncAllShopifyData(workspaceId: string, days: number = 90) {
  console.log(`Starting full Shopify sync for workspace ${workspaceId}...`);
  
  try {
    await syncShopifyShop(workspaceId);
    await syncShopifyProducts(workspaceId);
    await syncShopifyOrders(workspaceId, days);
    await syncShopifyEmailCampaigns(workspaceId, days);
    
    // Update integration status
    await prisma.integration.update({
      where: {
        workspaceId_type: {
          workspaceId,
          type: 'SHOPIFY',
        },
      },
      data: {
        status: 'CONNECTED',
        connectedAt: new Date(),
      },
    });

    console.log('Shopify sync completed successfully');
  } catch (error) {
    console.error('Shopify sync failed:', error);
    
    await prisma.integration.update({
      where: {
        workspaceId_type: {
          workspaceId,
          type: 'SHOPIFY',
        },
      },
      data: {
        status: 'ERROR',
      },
    });
    
    throw error;
  }
}
