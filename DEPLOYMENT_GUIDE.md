# HabibiStay Deployment Guide

## 🚀 Quick Start

Your HabibiStay application is now **production-ready** with all mock logic replaced by real implementations. Follow this guide to deploy your application.

---

## 📋 Prerequisites

Before deploying, ensure you have accounts and API keys for:

### Required Services
- **PostgreSQL Database** (Supabase, Railway, or AWS RDS)
- **Stripe** (Payment processing)
- **Cloudinary** (Image/video hosting)
- **OpenAI** (AI Assistant)

### Recommended Services
- **SendGrid** or **AWS SES** (Email delivery)
- **Vercel** or **AWS** (Hosting platform)
- **Sentry** (Error tracking - optional)
- **Google Analytics** (Analytics - optional)

---

## 🔧 Environment Setup

### Step 1: Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cd habibistay
cp .env.example .env
```

### Step 2: Fill Required Variables

Open `.env` and configure the following **required** variables:

#### Database
```env
DATABASE_URL="postgresql://user:password@host:5432/habibistay"
```

#### Authentication
```env
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
JWT_SECRET="your-jwt-secret"
```

#### Stripe Payment
```env
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

#### Cloudinary
```env
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

#### OpenAI
```env
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4-turbo-preview"
```

#### Email Service (Choose one)

**Option A: SendGrid**
```env
SENDGRID_API_KEY="SG...."
EMAIL_FROM="noreply@your-domain.com"
```

**Option B: AWS SES**
```env
AWS_SES_REGION="us-east-1"
AWS_SES_ACCESS_KEY_ID="..."
AWS_SES_SECRET_ACCESS_KEY="..."
EMAIL_FROM="noreply@your-domain.com"
```

**Option C: SMTP**
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="noreply@your-domain.com"
```

---

## 📦 Installation

### Step 1: Install Dependencies

```bash
cd habibistay
npm install
```

This will install all production dependencies including:
- Stripe SDK
- OpenAI SDK
- Cloudinary SDK
- Email providers
- Validation libraries
- UI components

### Step 2: Setup Database

Run Prisma migrations to create database tables:

```bash
npx prisma migrate deploy
```

Generate Prisma Client:

```bash
npx prisma generate
```

### Step 3: Seed Database (Optional)

Populate the database with initial data:

```bash
npm run seed
```

---

## 🏗️ Build for Production

### Build the Application

```bash
npm run build
```

This will:
- Compile TypeScript
- Bundle client and server code
- Optimize assets
- Generate static pages

### Verify Build

```bash
npm start
```

Visit `http://localhost:3000` to verify the production build works correctly.

---

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

Vercel provides the easiest deployment for Next.js applications.

#### Deploy via CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

#### Deploy via GitHub

1. Push your code to GitHub (already done ✅)
2. Visit [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables from `.env`
5. Deploy

#### Configure Vercel Environment Variables

In Vercel dashboard, add all variables from your `.env` file:
- Go to Project Settings → Environment Variables
- Add each variable individually
- Redeploy after adding variables

---

### Option 2: AWS (Advanced)

#### Using AWS Amplify

1. Connect your GitHub repository
2. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```
3. Add environment variables
4. Deploy

#### Using AWS EC2

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/Mirxa27/habibistay.git
cd habibistay/habibistay

# Install dependencies
npm install

# Build application
npm run build

# Install PM2 for process management
sudo npm install -g pm2

# Start application
pm2 start npm --name "habibistay" -- start

# Configure PM2 to start on boot
pm2 startup
pm2 save
```

---

### Option 3: Docker

#### Create Dockerfile

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Build and Run

```bash
docker build -t habibistay .
docker run -p 3000:3000 --env-file .env habibistay
```

---

## 🔐 Security Checklist

Before going live, ensure:

- [ ] All API keys are in environment variables (not hardcoded)
- [ ] `NODE_ENV=production` is set
- [ ] Database has proper access controls
- [ ] HTTPS is enabled (automatic with Vercel)
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Stripe is in live mode (not test mode)
- [ ] Email sender domain is verified
- [ ] Strong `NEXTAUTH_SECRET` is generated
- [ ] Webhook secrets are configured

---

## 📊 Post-Deployment Setup

### 1. Configure Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 2. Verify Email Delivery

Send a test email:
```bash
curl -X POST https://your-domain.com/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com"}'
```

### 3. Test Payment Flow

1. Create a test booking
2. Use Stripe test card: `4242 4242 4242 4242`
3. Verify payment confirmation email
4. Check Stripe dashboard for payment

### 4. Test AI Assistant

1. Open chat interface
2. Send a test message
3. Verify OpenAI response
4. Check property recommendations

### 5. Upload Test Media

1. Upload a test image
2. Verify Cloudinary storage
3. Check image optimization
4. Test video upload (if enabled)

---

## 🔍 Monitoring & Logging

### Setup Sentry (Optional)

1. Create account at [sentry.io](https://sentry.io)
2. Add to `.env`:
   ```env
   SENTRY_DSN="your-sentry-dsn"
   ```
3. Errors will be automatically tracked

### Setup Google Analytics (Optional)

1. Create GA4 property
2. Add to `.env`:
   ```env
   NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
   ```

### View Application Logs

**Vercel:**
- Dashboard → Deployments → View Logs

**AWS:**
```bash
pm2 logs habibistay
```

**Docker:**
```bash
docker logs -f container-id
```

---

## 🚨 Troubleshooting

### Build Fails

**Error: Module not found**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

**Error: Prisma Client not generated**
```bash
npx prisma generate
npm run build
```

### Runtime Errors

**Database Connection Failed**
- Verify `DATABASE_URL` is correct
- Check database is accessible from deployment server
- Ensure SSL mode is configured if required

**Stripe Payments Not Working**
- Verify `STRIPE_SECRET_KEY` is set correctly
- Check Stripe dashboard for errors
- Ensure webhook endpoint is accessible
- Verify webhook secret matches

**Email Not Sending**
- Check email provider credentials
- Verify sender email is verified
- Check spam folder
- Review email service logs

**AI Assistant Not Responding**
- Verify `OPENAI_API_KEY` is valid
- Check OpenAI usage limits
- Review API error logs
- Ensure model name is correct

---

## 📈 Performance Optimization

### Enable Caching (Optional)

Add Redis for session storage and caching:

```env
REDIS_URL="redis://localhost:6379"
```

### CDN Configuration

For static assets, configure CDN:

```env
CDN_URL="https://cdn.your-domain.com"
```

### Database Optimization

- Add indexes for frequently queried fields
- Enable connection pooling
- Use read replicas for high traffic

---

## 🔄 Continuous Deployment

### GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 📞 Support

If you encounter issues:

1. Check the [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for detailed implementation info
2. Review error logs in your deployment platform
3. Verify all environment variables are set correctly
4. Check service status pages (Stripe, OpenAI, Cloudinary)

---

## ✅ Deployment Checklist

- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Database migrated
- [ ] Application built successfully
- [ ] Production server started
- [ ] Stripe webhooks configured
- [ ] Email delivery verified
- [ ] AI assistant tested
- [ ] Media upload tested
- [ ] Mobile responsiveness verified
- [ ] SSL/HTTPS enabled
- [ ] Monitoring setup (optional)
- [ ] Backup strategy in place

---

## 🎉 You're Ready!

Your HabibiStay application is now deployed and ready to accept real bookings, process payments, send emails, and provide AI-powered assistance to users.

**Next Steps:**
1. Monitor initial traffic and errors
2. Gather user feedback
3. Iterate and improve
4. Scale infrastructure as needed

Good luck with your launch! 🚀
