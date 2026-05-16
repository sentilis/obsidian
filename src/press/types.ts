import type { RestClient } from '@sentilis/core';

type PressListResponse = Awaited<ReturnType<RestClient['listPress']>>;
type PressInfoResponse = Awaited<ReturnType<RestClient['getPress']>>;

export type PressItem = PressListResponse['data'][number];
export type PressDetailItem = PressInfoResponse['data'];
