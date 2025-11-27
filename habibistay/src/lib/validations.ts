import { z } from 'zod';

/**
 * Comprehensive validation schemas for HabibiStay
 * Using Zod for type-safe runtime validation
 */

// User validation schemas
export const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\u0600-\u06FF]+$/, 'Name can only contain letters and spaces'),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional(),
  role: z.enum(['GUEST', 'HOST', 'PROPERTY_MANAGER', 'ADMIN', 'INVESTOR']).default('GUEST'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  bio: z.string().max(500).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Property validation schemas
export const createPropertySchema = z.object({
  title: z.string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .min(50, 'Description must be at least 50 characters')
    .max(5000, 'Description must be less than 5000 characters'),
  type: z.enum(['Apartment', 'House', 'Villa', 'Room', 'Studio', 'Condo', 'Townhouse']),
  price: z.number()
    .positive('Price must be positive')
    .max(1000000, 'Price must be less than 1,000,000'),
  cleaningFee: z.number().positive().max(10000).optional(),
  serviceFee: z.number().positive().max(10000).optional(),
  address: z.string().min(5).max(300),
  city: z.string().min(2).max(100),
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  country: z.string().min(2).max(100),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  bedrooms: z.number().int().min(0).max(50),
  beds: z.number().int().min(0).max(100),
  bathrooms: z.number().int().min(0).max(50),
  maxGuests: z.number().int().min(1).max(100),
  amenities: z.array(z.string()).min(1, 'At least one amenity is required'),
  houseRules: z.string().max(2000).optional(),
  cancellationPolicy: z.string().max(2000).optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

export const searchPropertiesSchema = z.object({
  query: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  maxGuests: z.number().int().min(1).optional(),
  amenities: z.array(z.string()).optional(),
  propertyType: z.string().optional(),
  checkInDate: z.string().datetime().optional(),
  checkOutDate: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['price', 'rating', 'newest', 'popular']).default('popular'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Booking validation schemas
export const createBookingSchema = z.object({
  propertyId: z.string().cuid('Invalid property ID'),
  checkInDate: z.string().datetime('Invalid check-in date'),
  checkOutDate: z.string().datetime('Invalid check-out date'),
  numberOfGuests: z.number().int().min(1, 'At least one guest is required').max(100),
}).refine((data) => {
  const checkIn = new Date(data.checkInDate);
  const checkOut = new Date(data.checkOutDate);
  const now = new Date();
  
  return checkIn > now && checkOut > checkIn;
}, {
  message: 'Check-out date must be after check-in date, and both must be in the future',
  path: ['checkOutDate'],
});

export const updateBookingSchema = z.object({
  checkInDate: z.string().datetime().optional(),
  checkOutDate: z.string().datetime().optional(),
  numberOfGuests: z.number().int().min(1).max(100).optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'REJECTED']).optional(),
});

// Payment validation schemas
export const createPaymentSchema = z.object({
  bookingId: z.string().cuid('Invalid booking ID'),
  amount: z.number().positive('Amount must be positive').max(1000000),
  provider: z.enum(['STRIPE', 'PAYPAL', 'MYFATOORAH']).default('STRIPE'),
  currency: z.string().length(3, 'Currency must be 3 characters (e.g., USD)').default('USD'),
});

export const processPaymentSchema = z.object({
  paymentId: z.string().cuid('Invalid payment ID'),
  paymentMethodId: z.string().optional(),
  transactionDetails: z.record(z.any()).optional(),
});

// Review validation schemas
export const createReviewSchema = z.object({
  bookingId: z.string().cuid('Invalid booking ID'),
  propertyId: z.string().cuid('Invalid property ID'),
  subjectId: z.string().cuid('Invalid subject ID'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string()
    .min(10, 'Comment must be at least 10 characters')
    .max(2000, 'Comment must be less than 2000 characters'),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(10).max(2000).optional(),
  response: z.string().max(1000).optional(),
});

// Image upload validation
export const imageUploadSchema = z.object({
  propertyId: z.string().cuid('Invalid property ID'),
  caption: z.string().max(200).optional(),
  isPrimary: z.boolean().default(false),
});

// Notification validation
export const createNotificationSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  type: z.enum(['BOOKING_UPDATE', 'PAYMENT_UPDATE', 'BOOKING_REMINDER', 'MESSAGE', 'REVIEW', 'SYSTEM']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  data: z.string().optional(),
});

// AI Assistant validation
export const aiAssistantSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message must be less than 1000 characters'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(50, 'Conversation history too long').optional(),
  context: z.object({
    currentProperty: z.any().optional(),
    userPreferences: z.any().optional(),
    recentSearches: z.array(z.any()).optional(),
  }).optional(),
});

// Availability validation
export const checkAvailabilitySchema = z.object({
  propertyId: z.string().cuid('Invalid property ID'),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date'),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const updateAvailabilitySchema = z.object({
  propertyId: z.string().cuid('Invalid property ID'),
  date: z.string().datetime('Invalid date'),
  isAvailable: z.boolean(),
  price: z.number().positive().optional(),
});

// Contact form validation
export const contactFormSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5).max(200),
  message: z.string().min(20).max(2000),
});

// Newsletter subscription validation
export const newsletterSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
});

// Password reset validation
export const requestPasswordResetSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Type exports for TypeScript
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type SearchPropertiesInput = z.infer<typeof searchPropertiesSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ImageUploadInput = z.infer<typeof imageUploadSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type AIAssistantInput = z.infer<typeof aiAssistantSchema>;
export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Validation helper function
 * Validates data against a schema and returns typed result or throws error
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      throw new Error(JSON.stringify({
        message: 'Validation failed',
        errors: formattedErrors,
      }));
    }
    throw error;
  }
}

/**
 * Safe validation that returns success/error object
 */
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
} {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      return { success: false, errors: formattedErrors };
    }
    return { success: false, errors: [{ field: 'unknown', message: 'Validation failed' }] };
  }
}
