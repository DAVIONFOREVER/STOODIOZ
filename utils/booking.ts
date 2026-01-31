import type { Booking, Stoodio } from '../types';
import { BookingStatus } from '../types';

const getStartEnd = (booking: Booking): { start: Date; end: Date } | null => {
  if (!booking?.date || !booking?.start_time || booking.start_time === 'N/A') return null;
  const start = new Date(`${booking.date}T${booking.start_time}`);
  if (Number.isNaN(start.getTime())) return null;
  const durationHours = Number(booking.duration || 0);
  if (!Number.isFinite(durationHours) || durationHours <= 0) return null;
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  return { start, end };
};

export const isBookingActiveNow = (booking: Booking, now: Date = new Date()): boolean => {
  if (!booking || booking.status !== BookingStatus.CONFIRMED) return false;
  const window = getStartEnd(booking);
  if (!window) return false;
  const t = now.getTime();
  return t >= window.start.getTime() && t <= window.end.getTime();
};

const isBlockingStatus = (status?: BookingStatus): boolean => {
  return status === BookingStatus.CONFIRMED ||
    status === BookingStatus.PENDING ||
    status === BookingStatus.PENDING_APPROVAL ||
    status === BookingStatus.PENDING_LABEL_APPROVAL;
};

export const isBookingBlockingNow = (booking: Booking, now: Date = new Date()): boolean => {
  if (!booking || !isBlockingStatus(booking.status as BookingStatus)) return false;
  const window = getStartEnd(booking);
  if (!window) return false;
  const t = now.getTime();
  return t >= window.start.getTime() && t <= window.end.getTime();
};

export const getStoodioBookings = (bookings: Booking[], stoodioId: string): Booking[] => {
  if (!stoodioId) return [];
  return (bookings || []).filter((booking) => {
    const anyBooking = booking as any;
    return booking?.stoodio?.id === stoodioId || String(anyBooking?.stoodio_id || '') === stoodioId;
  });
};

export const getActiveStoodioBookings = (bookings: Booking[], stoodioId: string, now: Date = new Date()): Booking[] => {
  return getStoodioBookings(bookings, stoodioId).filter((booking) => isBookingActiveNow(booking, now));
};

export const getBlockingStoodioBookings = (bookings: Booking[], stoodioId: string, now: Date = new Date()): Booking[] => {
  return getStoodioBookings(bookings, stoodioId).filter((booking) => isBookingBlockingNow(booking, now));
};

export const getStoodioRoomAvailability = (
  stoodio: Stoodio,
  bookings: Booking[],
  now: Date = new Date()
): { totalRooms: number | null; activeRooms: number; availableRooms: number | null } => {
  const totalRooms = Array.isArray(stoodio?.rooms) ? stoodio.rooms.length : 0;
  if (!totalRooms) return { totalRooms: null, activeRooms: 0, availableRooms: null };

  const activeBookings = getBlockingStoodioBookings(bookings, stoodio.id, now);
  const usedRoomIds = new Set<string>();
  let activeRooms = 0;
  activeBookings.forEach((booking) => {
    if (booking?.room?.id) {
      usedRoomIds.add(booking.room.id);
    } else {
      activeRooms += 1;
    }
  });
  activeRooms += usedRoomIds.size;
  const availableRooms = Math.max(0, totalRooms - activeRooms);
  return { totalRooms, activeRooms, availableRooms };
};

export const getBookingParticipantIds = (booking: Booking): string[] => {
  const ids = new Set<string>();
  const anyBooking = booking as any;
  if (booking?.artist?.id) ids.add(booking.artist.id);
  if (booking?.engineer?.id) ids.add(booking.engineer.id);
  if (booking?.producer?.id) ids.add(booking.producer.id);
  if (booking?.stoodio?.id) ids.add(booking.stoodio.id);
  if (anyBooking?.booked_by_id) ids.add(String(anyBooking.booked_by_id));
  if (anyBooking?.requested_engineer_id) ids.add(String(anyBooking.requested_engineer_id));
  if (anyBooking?.engineer_profile_id) ids.add(String(anyBooking.engineer_profile_id));
  if (anyBooking?.producer_id) ids.add(String(anyBooking.producer_id));
  if (anyBooking?.stoodio_id) ids.add(String(anyBooking.stoodio_id));
  return Array.from(ids);
};

export const isUserInActiveSession = (booking: Booking, profileId: string): boolean => {
  if (!profileId) return false;
  return isBookingActiveNow(booking) && getBookingParticipantIds(booking).includes(profileId);
};
