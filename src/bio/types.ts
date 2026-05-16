import type { RestClient } from '@sentilis/core';

type BioListResponse = Awaited<ReturnType<RestClient['listBio']>>;
type BioInfoResponse = Awaited<ReturnType<RestClient['getBio']>>;

export type BioItem = BioListResponse['data'][number];
export type BioDetailItem = BioInfoResponse['data'];
