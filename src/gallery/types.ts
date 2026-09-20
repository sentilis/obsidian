import type { RestClient } from '@sentilis/sdk';

type GalleryListResponse = Awaited<ReturnType<RestClient['listGallery']>>;
export type GalleryItem = GalleryListResponse['data'][number];
