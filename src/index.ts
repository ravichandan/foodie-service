
// src/index.ts
// import dotenv from 'dotenv';
import { Context, Hono, MiddlewareHandler, Next } from 'hono';
import {db} from './config/mongo-data-api.db.config';
import { applyMiddleware } from './utils';
import controllers from './controllers';
import { compress } from 'hono/compress';
import { cors } from 'hono/cors';
import { RequestHandler } from 'express';
import { applyHonoRoutes, getLogger } from './utils/Utils';
import serviceRoutes from './hono/routes/service.routes';
import { env } from 'hono/adapter'
import { nanoid } from "nanoid";
import { r2Provider } from './bucketers/r2.provider';
import { Media } from './entities/media';
import mongoose from 'mongoose';


const log = getLogger('service.routes');

// dotenv.config();

export type Bindings = {
	MY_BUCKET: R2Bucket
}

mongoose.connect('https://ap-southeast-2.aws.data.mongodb-api.com/app/data-ttagxfs/endpoint/data/v1')
	.then(()=> console.log('db connected fine'))
	.catch(e => console.log('Error in db connection',e));
console.log('in index.ts, process.env:: ', process.env);

// Create a new Hono app
const app = new Hono<{
	Bindings: Bindings
}>()
console.log('in index.ts, process.env:: ', app);

// app.use(compress());
app.use(cors());
// Middleware to log the turnaround time for a request
const turnaroundTimeMiddleware = async (c: Context, next: Next) => {
	const startTime = Date.now();

	// Proceed to the next middleware or route handler
	await next();

	const endTime = Date.now();
	const turnaroundTime = endTime - startTime;
	console.log(`Request to ${c.req.url} took ${turnaroundTime}ms`);
}
app.use('*', turnaroundTimeMiddleware)

app.post('/api/v1/upload', async (c) => {
	const key = nanoid(10)
	const formData = await c.req.parseBody()
	const file = formData['file']
	console.log('in http://localhost:8787/api/v1/upload')
	if (file instanceof File) {
		const fileBuffer: ReadableStream = await file.stream();
	console.log('in http://localhost:8787/api/v1/upload')
		let result = await r2Provider.uploadV3(key+'ss', fileBuffer);
		const fullName = file.name
		const ext = fullName.split('.').pop()
		const path = `images/${key}.${ext}`
		// let result = await c.env.MY_BUCKET.put(path, fileBuffer)
		console.log('hono file upload result:: ', result);
		return c.json({
			'image': {
				// 'url': `${HOST}${path}`
				'url': result?.Location

			}
		})
	} else {
		return c.text('Invalid file', 400)
	}
})

// Define a simple GET endpoint
app.get('/', async (c: Context< any>) => {

	const result = await db.collection('comments').find({});//.then(x => console.log('In new hono, x ::', x))// Export the app to handle requests
	// c.req;
	// c.res
	const { S3_BUCKET } = env<{ S3_BUCKET: string }>(c)

	console.log('S3_BUCKET:: ,', S3_BUCKET);
	log.debug('resulttt:: ,', result);
	console.log('in Media.find();', db.collection('media').find({}));
	return c.text('Hello, Cloudflare Workers with Hono!')
});

applyHonoRoutes(serviceRoutes, app);
// Define another endpoint
app.get('/api/greet/:name', (c) => {
	const name = c.req.param('name')
	return c.json({ message: `Hello, ${name}!` })
})

	// compression() as MiddlewareHandler)
// const router = app();
// applyMiddleware(controllers, app);


export default app
