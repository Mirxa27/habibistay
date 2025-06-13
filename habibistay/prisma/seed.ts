import { PrismaClient, UserRole, BookingStatus, PaymentStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create demo users
  const passwordHash = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const host = await prisma.user.upsert({
    where: { email: 'host@example.com' },
    update: {},
    create: {
      email: 'host@example.com',
      name: 'Demo Host',
      password: passwordHash,
      role: UserRole.HOST,
    },
  });

  const guest = await prisma.user.upsert({
    where: { email: 'guest@example.com' },
    update: {},
    create: {
      email: 'guest@example.com',
      name: 'Demo Guest',
      password: passwordHash,
      role: UserRole.GUEST,
    },
  });

  // Create a demo property
  const property = await prisma.property.upsert({
    where: { id: 'demo-property' },
    update: {},
    create: {
      id: 'demo-property',
      title: 'Cozy Apartment',
      description: 'A lovely place to stay',
      ownerId: host.id,
      type: 'Apartment',
      price: 100,
      address: '123 Main St',
      city: 'Dubai',
      country: 'UAE',
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
      maxGuests: 2,
      amenities: ['wifi','kitchen'],
      isPublished: true,
    },
  });

  // Create availability for next 30 days
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    await prisma.availability.upsert({
      where: { propertyId_date: { propertyId: property.id, date } },
      update: {},
      create: {
        propertyId: property.id,
        date,
        isAvailable: true,
      },
    });
  }

  // Create a demo booking
  const booking = await prisma.booking.create({
    data: {
      propertyId: property.id,
      guestId: guest.id,
      checkInDate: new Date(today.getTime() + 86400000),
      checkOutDate: new Date(today.getTime() + 2*86400000),
      numberOfGuests: 2,
      totalPrice: 200,
      status: BookingStatus.CONFIRMED,
    },
  });

  // Payment stub
  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      amount: 200,
      currency: 'USD',
      provider: 'demo',
      status: PaymentStatus.COMPLETED,
    },
  });

  await prisma.notification.create({
    data: {
      userId: host.id,
      type: NotificationType.BOOKING_UPDATE,
      title: 'New booking',
      message: 'You have a new booking!',
    },
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
