import type { RestClient } from '@sentilis/sdk';

type ProductListResponse = Awaited<ReturnType<RestClient['listProduct']>>;

export type ProductItem = ProductListResponse['data'][number];
