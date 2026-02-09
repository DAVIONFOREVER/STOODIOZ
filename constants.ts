
// This file now only contains simple, shared constants for the application.
// All mock data has been removed to prepare for a real backend integration.

export const USER_SILHOUETTE_URL = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a1a1aa'%3e%3cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3e%3c/svg%3e";
export const STOODIO_ICON_URL = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a1a1aa'%3e%3cpath d='M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z'/%3e%3c/svg%3e";
export const ARIA_PROFILE_IMAGE_URL = '/aria/0F91FD16-F2C6-4F90-8B50-925A73EF5BB3.PNG';
export const ARIA_COVER_IMAGE_URL = '/aria/447903D2-49A6-41A9-88FB-3A9E56BDC151.PNG';
export const ARIA_GALLERY_IMAGES = [
  '/aria/49865374-4F6A-4EDD-84AB-6F7F6BD8F4E1.PNG',
  '/aria/4A4AC086-96E4-44D9-912A-0D9B9F128576.PNG',
  '/aria/69A845AD-5999-4E03-B4AF-F426837B7759.PNG',
  '/aria/7A0AC145-EA4D-4F2C-9BB1-81C0A188417D.PNG',
  '/aria/8BE47D0C-1207-4285-BB6C-E3D792F4F547.PNG',
  '/aria/B5EC9F3D-6947-4113-9B19-8E4B1453F782.PNG',
  '/aria/B7D0B1E8-02F9-4B46-B97D-0E67A13008BD.PNG',
  '/aria/C0C49F08-6DD9-41F2-8905-6403B2451156.PNG',
  '/aria/D3880F26-561D-442A-9798-2F4B338D8E20.PNG',
  '/aria/D4262BE5-A0D7-49B6-9855-B81610AD2833.PNG',
  '/aria/DA503840-86BC-4114-A5B9-EBE56D21630A.PNG',
];
export const ARIA_CANTATA_IMAGE_URL = ARIA_PROFILE_IMAGE_URL;

export const SERVICE_FEE_PERCENTAGE = 0.15;
export const ARIA_EMAIL = 'aria@stoodioz.ai';

/** Single source of truth for main hero/tagline (Landing + Choose Profile stay in sync) */
export const LANDING_HERO_LINE = 'Book recording sessions with Stoodios, engineers, and producers.';
export const LANDING_TAGLINE = 'Discover. Book. Get to work.';

export { getProfileImageUrl } from './utils/getProfileImageUrl';
export { getDisplayName } from './utils/getDisplayName';
