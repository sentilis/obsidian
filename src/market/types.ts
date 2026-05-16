import type { RestClient } from '@sentilis/core';

type ProductListResponse = Awaited<ReturnType<RestClient['listProduct']>>;

export type ProductItem = ProductListResponse['data'][number];
