# Web Code Generator

A secure web-based code generation platform with authentication and advanced code generation capabilities.

## Environment Variables

The following environment variables must be set in your Render dashboard:

```
BASE_URL=https://web-code-generator.onrender.com
GEMINI_API_KEY=your_gemini_api_key
SESSION_SECRET=your_random_secret_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials:
   - Add authorized redirect URI: `https://web-code-generator.onrender.com/auth/google/callback`

## Features

- Code generation using Google's Gemini AI
- Secure authentication with Google Sign-In
- Support for 500+ programming languages and technologies
- Advanced code search and categorization
- "Remember Me" functionality
- Rate limiting protection
