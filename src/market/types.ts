import type { RestClient } from '@sentilis/cli';

type ProductListResponse = Awaited<ReturnType<RestClient['listProduct']>>;

export type ProductItem = ProductListResponse['data'][number];
