# Email Campaign Application with Brevo Integration

A comprehensive email campaign management system built with Next.js, Prisma, RabbitMQ, and Brevo integration. This application allows you to create, manage, and send email campaigns to your contact groups with powerful templating features.

![Email Campaign App](https://your-screenshot-url-here.png)

## Features

- **User Authentication**: Secure login with Google OAuth
- **Contact Management**: Import contacts via Excel/CSV, organize into groups
- **Email Templates**: Create and manage reusable email templates with variables
- **Campaign Management**: Create, schedule, and track email campaigns
- **Rich Email Editor**: WYSIWYG editor with HTML code view and preview
- **Template Variables**: Personalize emails with dynamic content
- **Brevo Integration**: Send emails using Brevo SMTP and track analytics
- **Background Processing**: RabbitMQ for reliable email delivery
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Email**: Brevo (formerly Sendinblue)
- **Authentication**: NextAuth.js with Google OAuth
- **Message Queue**: RabbitMQ
- **Editor**: Lexical (React-based rich text editor)
- **Containerization**: Docker

## Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- RabbitMQ server
- Brevo account (for SMTP and API access)
- Google OAuth credentials

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```javascript
# Database
DATABASE_URL="postgresql://username:password@hostname:port/database?schema=public"
DIRECT_URL="postgresql://username:password@hostname:port/database?schema=public"

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# RabbitMQ
RABBITMQ_HOST=your-rabbitmq-host
RABBITMQ_PORT=5672
RABBITMQ_USER=your-rabbitmq-user
RABBITMQ_PASSWORD=your-rabbitmq-password
```

## Installation and Setup

### Option 1: Running Locally

1. Clone the repository:

```javascript
   git clone https://github.com/yourusername/email-campaign-app.git
   cd email-campaign-app
```

2. Install dependencies:

```javascript
   npm install
```

3. Generate Prisma client:

```javascript
   npx prisma generate
```

4. Run database migrations:

```javascript
   npx prisma migrate dev
```

5. Start the development server:

```javascript
   npm run dev
```

6. Start the workers:

```javascript
   npm run start:email-worker
   npm run start:scheduler-worker
```

### Option 2: Using Docker

1. Clone the repository:

```javascript
   git clone https://github.com/yourusername/email-campaign-app.git
   cd email-campaign-app
```

2. Build and start the Docker containers:

```javascript
   docker-compose up -d
```

## Getting Started

1. Access the application at http://localhost:3000
2. Sign in with your Google account
3. Configure Brevo API keys in Settings
4. Create contact groups and import contacts
5. Create email templates
6. Create and send your first campaign

## Project Structure

```javascript
email-campaign-app/
├── app/                         # Next.js App Router pages
│   ├── api/                     # API routes
│   ├── auth/                    # Auth pages
│   ├── campaigns/               # Campaign pages
│   ├── contacts/                # Contact pages
│   ├── dashboard/               # Dashboard page
│   ├── groups/                  # Groups pages
│   ├── settings/                # Settings page
│   ├── templates/               # Email templates pages
│   ├── globals.css              # Global CSS
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/                  # React components
├── hooks/                       # Custom React hooks
├── lib/                         # Utility libraries
├── prisma/                      # Prisma ORM
├── types/                       # TypeScript type definitions
├── workers/                     # Background workers
├── .env                         # Environment variables
├── docker-compose.yml           # Docker Compose configuration
├── Dockerfile                   # Main application Dockerfile
└── next.config.js               # Next.js configuration
```

## Brevo Integration

This application uses Brevo (formerly Sendinblue) for sending emails. You'll need to:

1. Create a Brevo account at https://www.brevo.com/
2. Generate an API key and SMTP credentials
3. Add these credentials in the app's Settings page

## License

[MIT License](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [RabbitMQ](https://www.rabbitmq.com/)
- [Brevo](https://www.brevo.com/)
- [Lexical](https://lexical.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
