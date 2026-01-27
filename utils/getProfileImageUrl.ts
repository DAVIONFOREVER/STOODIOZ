const FALLBACK = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a1a1aa'%3e%3cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3e%3c/svg%3e";
const ARIA_IMG = '/aria/0F91FD16-F2C6-4F90-8B50-925A73EF5BB3.PNG';
const ARIA_EMAIL = 'aria@stoodioz.ai';

export function getProfileImageUrl(
  user: { email?: string | null; image_url?: string | null } | null | undefined,
  fallback = FALLBACK
): string {
  if (user == null) return fallback;
  if (user.email === ARIA_EMAIL) return ARIA_IMG;
  return user.image_url || fallback;
}
