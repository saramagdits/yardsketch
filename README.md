# YardSketch - Professional Landscape Design Proposals

YardSketch is a web application that allows independent landscapers to generate high-quality landscape design proposals with AI-powered visuals in just 15 minutes. No CAD skills or copywriting required.

## Features

- **AI-Generated Renderings**: Upload a photo and get multiple professional landscape design options
- **Professional Proposals**: Detailed design explanations, material lists, and cost estimates
- **Instant Downloads**: Download proposals as professional PDFs ready for clients
- **Google OAuth Authentication**: Secure user authentication
- **Firebase Integration**: Cloud storage for projects and user data
- **Stripe Payments**: Integrated payment processing
- **Modern UI**: Clean, responsive design built with Next.js and Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **AI**: OpenAI GPT-4 for content generation, DALL-E for image generation
- **Payments**: Stripe
- **PDF Generation**: Puppeteer or react-pdf

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google OAuth credentials
- Firebase project
- OpenAI API key
- Stripe account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd yardsketch
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment template:
```bash
cp env.local.template .env.local
```

4. Configure your environment variables in `.env.local`:
```env
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Firebase
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Setup Instructions

#### 1. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs
6. Copy Client ID and Client Secret to your `.env.local`

#### 2. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Google provider)
4. Create a Firestore database
5. Enable Storage
6. Copy configuration to your `.env.local`

#### 3. OpenAI Setup
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account and get API key
3. Add API key to your `.env.local`

#### 4. Stripe Setup
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create an account
3. Get your publishable and secret keys
4. Add keys to your `.env.local`

### Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard page
│   ├── projects/          # Project pages
│   └── layout.tsx         # Root layout
├── components/            # React components
├── lib/                   # Utility libraries
├── types/                 # TypeScript type definitions
└── styles/                # Global styles
```

## API Routes

- `POST /api/projects` - Create new project with AI generation
- `GET /api/projects` - Get user's projects
- `GET /api/projects/[id]` - Get specific project
- `POST /api/auth/[...nextauth]` - NextAuth.js authentication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@yardsketch.com or create an issue in the repository.
