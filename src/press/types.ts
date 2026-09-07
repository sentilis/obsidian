import type { RestClient } from '@sentilis/cli';

type PressListResponse = Awaited<ReturnType<RestClient['listPress']>>;
type PressInfoResponse = Awaited<ReturnType<RestClient['getPress']>>;

export type PressItem = PressListResponse['data'][number];
export type PressDetailItem = PressInfoResponse['data'];
