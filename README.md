# HabibiStay - Modern Vacation Rental Platform

A comprehensive vacation rental platform built with Next.js 14, TypeScript, Prisma, and modern web technologies. HabibiStay offers a complete solution for property management, booking, payments, and AI-powered assistance.

## 🚀 Features

### Core Features
- **Property Management**: Complete CRUD operations for properties with image upload
- **Booking System**: Advanced booking with availability management
- **User Authentication**: Secure JWT-based authentication with role-based access
- **Payment Integration**: Stripe, PayPal, and MyFatoorah payment gateways
- **AI Assistant**: Sara, an AI-powered travel assistant for personalized recommendations
- **Real-time Notifications**: WebSocket-based notification system
- **Multi-language Support**: Internationalization ready
- **Responsive Design**: Mobile-first, accessible design

### Advanced Features
- **Channel Manager**: Integration with external booking platforms
- **Voice Control**: Voice-activated search and navigation
- **Investor Portal**: Property investment opportunities
- **Analytics Dashboard**: Comprehensive reporting and insights
- **SEO Optimization**: Next.js SEO with dynamic meta tags
- **PWA Support**: Progressive Web App capabilities

## 🛠 Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Icons**: Comprehensive icon library
- **Framer Motion**: Animation library
- **React Hook Form**: Form management with validation

### Backend
- **Prisma**: Type-safe database ORM
- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage
- **JWT**: Authentication tokens
- **bcryptjs**: Password hashing

### External Services
- **Cloudinary**: Image upload and management
- **Stripe**: Payment processing
- **OpenAI**: AI assistant capabilities
- **Mapbox**: Maps and geolocation
- **Resend**: Email delivery

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Playwright**: E2E testing
- **Husky**: Git hooks

## 📋 Prerequisites

- **Node.js**: Version 18 or newer
- **npm**: Version 9 or newer
- **PostgreSQL**: Version 12 or newer
- **Redis**: Version 6 or newer (optional for development)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd habibistay
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

```bash
# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database (optional)
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Required
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
JWT_SECRET=your-jwt-secret
DATABASE_URL=postgresql://username:password@localhost:5432/habibistay

# Optional (for full functionality)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
STRIPE_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-...
```

### Database Configuration

1. **PostgreSQL Setup**:
   ```bash
   # Create database
   createdb habibistay
   
   # Run migrations
   npm run db:migrate
   ```

2. **Redis Setup** (optional):
   ```bash
   # Install Redis
   brew install redis  # macOS
   sudo apt-get install redis-server  # Ubuntu
   
   # Start Redis
   redis-server
   ```

## 📁 Project Structure

```
habibistay/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── (auth)/         # Authentication pages
│   │   ├── properties/     # Property pages
│   │   └── ...
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components
│   │   ├── layout/        # Layout components
│   │   └── ...
│   ├── lib/               # Utility libraries
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── middleware.ts      # Next.js middleware
├── prisma/                # Database schema and migrations
├── tests/                 # Test files
├── docs/                  # Documentation
└── public/                # Static assets
```

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Test Structure

- **Unit Tests**: Component and utility function tests
- **Integration Tests**: API route and database tests
- **E2E Tests**: Full user journey tests with Playwright

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Variables for Production

Ensure all required environment variables are set in your production environment:

```env
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-secret
JWT_SECRET=your-production-jwt-secret
DATABASE_URL=your-production-database-url
```

### Deployment Platforms

- **Vercel**: Recommended for Next.js applications
- **Netlify**: Alternative deployment option
- **Docker**: Containerized deployment
- **AWS/GCP**: Cloud platform deployment

## 🔒 Security

### Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input sanitization
- **CORS Protection**: Cross-origin resource sharing protection
- **Security Headers**: HTTP security headers
- **Password Hashing**: bcrypt password encryption
- **SQL Injection Protection**: Prisma ORM protection

### Security Best Practices

1. **Environment Variables**: Never commit sensitive data
2. **Regular Updates**: Keep dependencies updated
3. **HTTPS**: Always use HTTPS in production
4. **Input Validation**: Validate all user inputs
5. **Error Handling**: Don't expose internal errors

## 📊 Performance

### Optimization Features

- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic code splitting
- **Caching**: Redis-based caching
- **CDN**: Cloudinary CDN for images
- **Bundle Analysis**: Webpack bundle analyzer
- **Lazy Loading**: Component and image lazy loading

### Performance Monitoring

- **Core Web Vitals**: Performance metrics tracking
- **Error Tracking**: Sentry integration
- **Analytics**: Google Analytics integration
- **Logging**: Structured logging with different levels

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Run tests**: `npm test`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with strict rules
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Standardized commit messages
- **Test Coverage**: Minimum 80% test coverage

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help

- **Documentation**: Check the `/docs` folder for detailed documentation
- **Issues**: Report bugs and feature requests on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact support@habibistay.com

### Common Issues

1. **Database Connection**: Ensure PostgreSQL is running and accessible
2. **Environment Variables**: Verify all required variables are set
3. **Dependencies**: Run `npm install` to install missing packages
4. **Port Conflicts**: Change the port in `package.json` if 3000 is occupied

## 🗺 Roadmap

### Upcoming Features

- [ ] **Mobile App**: React Native mobile application
- [ ] **Advanced Analytics**: Machine learning insights
- [ ] **Virtual Tours**: 360° property tours
- [ ] **Blockchain Integration**: Decentralized booking system
- [ ] **Voice Assistant**: Advanced voice control features
- [ ] **Multi-currency**: International payment support

### Version History

- **v1.0.0**: Initial release with core features
- **v1.1.0**: AI assistant integration
- **v1.2.0**: Payment gateway integration
- **v1.3.0**: Advanced booking system
- **v2.0.0**: Complete platform overhaul (current)

---

**Built with ❤️ by the HabibiStay Team**
