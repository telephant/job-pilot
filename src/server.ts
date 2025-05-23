import express, { Express } from 'express';
import path from 'path';
import { server as serverLogger } from './utils/debug';

const app: Express = express();
const PORT = 3000;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  next();
});

// Serve static files from the public directory
app.use(express.static('public'));

// Root route to serve the index.html
app.get('/', (req, res) => {
  res.sendFile(path.resolve('./public/index.html'));
});

// Function to start the server
export function startServer(): Promise<void> {
  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      serverLogger.log('Server running at http://localhost:%d/', PORT);
      serverLogger.log('When Google redirects, the authorization code will be displayed for easy copying.');
      resolve();
    });
  });
}

// Auto-start server when this module is imported directly
if (require.main === module) {
  startServer().then(async () => {
    const { default: open } = await import('open');
    open(`http://localhost:${PORT}`);
  });
}

export default app; 