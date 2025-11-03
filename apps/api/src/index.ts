import dotenv from 'dotenv';
import { env } from './config/env';
import { createServer } from './server';

// Load environment variables
dotenv.config();

// Validate environment variables on startup
// This will throw an error and prevent server start if validation fails
const PORT = env.PORT;

// Create Express app
const server = createServer();

server.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${env.NODE_ENV}`);
  console.log(`🔒 CORS allowed origins: ${env.ALLOWED_ORIGINS.join(', ')}`);
});
