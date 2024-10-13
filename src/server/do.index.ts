import { createServer } from 'http';
import { parse }  from 'url';
import express from 'express';
import { IncomingMessage, ServerResponse } from 'node:http';
const app = express();

app.get('/', (req, res) => {
	res.send('Hello, DigitalOcean Functions with TypeScript!');
});

// Create an HTTP server and pass the Express app to it
const server = createServer((req: IncomingMessage, res: ServerResponse) => {
	const parsedUrl = parse(req.url || '', true);
	(req as any).query = parsedUrl.query;
	app(req as any, res as any);
});

// Export the server as a function for DigitalOcean Functions
export default server;
