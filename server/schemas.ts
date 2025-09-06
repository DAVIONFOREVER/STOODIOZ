/**
 * @file server/schemas.ts
 * @description
 * This file defines the database schemas for the Stoodioz application.
 * These schemas act as the blueprint for our data, outlining the structure,
 * types, and relationships for users, stoodioz, bookings, etc.
 *
 * This is the foundational step for building the real-world backend API.
 */

// --- ENUMS ---
// Enums are used to define a set of named constants.

enum UserRole {
  ARTIST,
  STOODIO,
  ENGINEER,
}

enum BookingStatus {
  PENDING,
  PENDING_APPROVAL,
  CONFIRMED,
  IN_PROGRESS,
  COMPLETED,
  CANCELLED,
}

enum BookingRequestType {
  FIND_AVAILABLE,
  SPECIFIC_ENGINEER,
  BRING_YOUR_OWN,
}


// --- CORE MODELS ---
// These models represent the main entities in our database.

/**
 * The base User model for authentication and core identification.
 * Each user has one specific profile (Artist, Stoodio, or Engineer).
 */
interface User {
  id: string; // Primary Key, e.g., cuid()
  email: string; // Unique, required
  passwordHash: string; // Required, never store plain text
  role: UserRole; // Required
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  artistProfile?: ArtistProfile;   // One-to-one
  stoodioProfile?: StoodioProfile; // One-to-one
  engineerProfile?: EngineerProfile; // One-to-one
}

/**
 * Profile for a User with the ARTIST role.
 */
interface ArtistProfile {
  id: string;
  userId: string; // Foreign Key to User
  name: string;
  imageUrl: string;
  bio: string;
  links?: { title: string; url: string }[];
  coordinates: { lat: number; lon: number };
  isSeekingSession: boolean;

  // Relationships
  user: User; // The user this profile belongs to
  bookings: Booking[]; // Bookings made by this artist
  sentMessages: Message[];
  reviewsGiven: Review[];
  
  // Following/Followers would be managed via a separate join table
  // e.g., Follows { followerId, followingId }
}

/**
 * Profile for a User with the ENGINEER role.
 */
interface EngineerProfile {
  id: string;
  userId: string; // Foreign Key to User
  name: string;
  bio: string;
  specialties: string[];
  rating: number; // Calculated field from reviews
  sessionsCompleted: number; // Calculated field from bookings
  imageUrl: string;
  audioSampleUrl: string;
  coordinates: { lat: number; lon: number };
  isAvailable: boolean;

  // Relationships
  user: User;
  bookings: Booking[]; // Bookings this engineer worked on
  sentMessages: Message[];
  reviewsReceived: Review[];
}

/**
 * Profile for a User with the STOODIO role.
 */
interface StoodioProfile {
  id: string;
  userId: string; // Foreign Key to User
  name: string;
  description: string;
  location: string;
  hourlyRate: number;
  rating: number; // Calculated from reviews
  imageUrl: string;
  amenities: string[];
  coordinates: { lat: number; lon: number };
  photos: string[];

  // Relationships
  user: User;
  bookings: Booking[]; // Bookings at this stoodio
  sentMessages: Message[];
  reviewsReceived: Review[];
}


// --- TRANSACTIONAL & SOCIAL MODELS ---

/**
 * Represents a booking transaction.
 */
interface Booking {
  id: string;
  artistId: string;   // Foreign Key to User (Artist)
  stoodioId: string;  // Foreign Key to User (Stoodio)
  engineerId?: string; // Foreign Key to User (Engineer), optional

  date: Date;
  startTime: string;
  duration: number; // in hours
  totalCost: number;
  tip?: number;

  status: BookingStatus;
  requestType: BookingRequestType;
  
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  artist: User;
  stoodio: User;
  engineer?: User;
}

/**
 * Represents a review left by an artist for a stoodio or engineer.
 */
interface Review {
  id: string;
  reviewerId: string;  // Foreign Key to User (Artist)
  revieweeId: string;  // Foreign Key to User (Stoodio or Engineer)
  bookingId: string;   // Foreign Key to Booking, ensures review is for a real session

  rating: number; // 1-5
  comment: string;
  
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  reviewer: User;
  reviewee: User;
  booking: Booking;
}

/**
 * Represents a conversation between two users.
 */
interface Conversation {
  id: string;
  createdAt: Date;

  // Relationships
  participants: User[]; // Many-to-Many relation with User
  messages: Message[];
}

/**
 * Represents a single message within a conversation.
 */
interface Message {
  id: string;
  conversationId: string; // Foreign Key to Conversation
  senderId: string;       // Foreign Key to User
  
  text: string;
  timestamp: Date; // same as createdAt

  // Relationships
  conversation: Conversation;
  sender: User;
}
