export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIAL_REFUND = 'PARTIAL_REFUND'
}

export enum UserRole {
  GUEST = 'GUEST',
  HOST = 'HOST',
  PROPERTY_MANAGER = 'PROPERTY_MANAGER',
  ADMIN = 'ADMIN',
  INVESTOR = 'INVESTOR'
}

export enum NotificationType {
  BOOKING = 'BOOKING',
  PAYMENT = 'PAYMENT'
}

export class PrismaClient {
  [key: string]: any;
}
export const Prisma = { }; // minimal stub
