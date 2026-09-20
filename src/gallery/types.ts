import type { RestClient } from '@sentilis/cli';

type GalleryListResponse = Awaited<ReturnType<RestClient['listGallery']>>;
export type GalleryItem = GalleryListResponse['data'][number];
