import { Request, Response } from 'express';
import { getLogger } from '../utils/Utils';
import { placeController } from '../controllers/place.controller';
import { checkSchema, validationResult } from 'express-validator';
import * as FieldConfigs from '../config/field.config';
import { handleSingleUploadFile } from '../utils/LocalFileStorage';
import { mediaController } from '../controllers/media.controller';
import { itemController } from '../controllers/item.controller';
import { lastValueFrom, of, tap } from 'rxjs';
import { reviewController } from '../controllers/review.controller';
import { customerController } from '../controllers/customer.controller';
import { r2Provider } from '../bucketers/r2.provider';
import { mediaService } from '../services/media.service';
import { HTTP400Error, HTTP404Error } from '../utils/error4xx';
import { IPlaceItem } from '../entities/placeItem';
// import { getPopularPlacesAndItems } from '../config/field.config';
import { HTTPClientError } from '../utils/errorHttp';

const log = getLogger('service.routes');
export type UploadedFile = {
	fieldname: string; // file
	originalname: string; // myPicture.png
	encoding: string; // 7bit
	mimetype: string; // image/png
	destination: string; // ./public/uploads
	filename: string; // 1571575008566-myPicture.png
	path: string; // public/uploads/1571575008566-myPicture.png
	size: number; // 1255
};
export default [
	{
		path: '/pulse',
		method: 'get',
		validators: [],
		handler: async (_: Request, res: Response) => {
			res.sendStatus(200);
		},
	},
	{
		path: '/',
		method: 'get',
		validators: [],
		handler: (_: Request, res: Response): Promise<any> => {
			log.trace('Server is up and running');
			// of({ id, name: 'username' })
			// return
			res.status(200);

			return lastValueFrom(of('hello').pipe(tap((x) => res.send(x))));
			/* return the Rx stream as promise to express, so it traces its lifecycle */
			// .then(
			// 	user => res.send(user),
			// 	err => res.status(500).send(err.message)
			// );
			// res.send('Up and running!!');
		},
	},
	{
		path: '/r2buckets',
		method: 'get',
		validators: [],
		handler: async (_: Request, res: Response) => {
			log.trace('Server is up and running');
			// of({ id, name: 'username' })
			// return
			// await r2Provider.putFile();
			const result = await r2Provider.listBuckets();
			log.trace('In get listBuckets(), result: ', result);
			res.status(200).send(result);
			// return r2Provider.listBuckets();
			// res.status(200);

			// return lastValueFrom(of('hello').pipe(tap(x => res.send(x))));
			/* return the Rx stream as promise to express, so it traces its lifecycle */
			// .then(
			// 	user => res.send(user),
			// 	err => res.status(500).send(err.message)
			// );
			// res.send('Up and running!!');
		},
	},
	{
		path: '/delete-test',
		method: 'delete',
		validators: [],
		handler: async (req: Request, res: Response) => {
			await mediaService.removeMediaFromR2(['123-4010-1718378740461']);
			res.status(204);
		},
	},
	{
		path: '/upload-test',
		method: 'post',
		validators: [],
		handler: async (req: Request, res: Response) => {
			log.trace('In POST /upload-test');

			// const result = await r2Provider.listBuckets()
			/*let result = await r2FileUpload(req, res);
			result = await mediaService.addMultipleMedias(req,res);
			*/
			let result;
			try {
				result = await mediaController.uploadMultipleMedias(req, res);
			} catch (error: any){
				log.error('Uploading multiple medias resulted in error', error);
				return res.status(400).json(error);
			}
			// add the media file url into database
			if (Array.isArray(result)) {
				try {
					await mediaController.addMultipleMedias(req.body, result);
				} catch (e: any) {
					log.error('in service.routes, caught result: ', result);
					log.error('in service.routes, caught error: ', e);
					mediaController.removeUploadedMedias(result.map(o => o.Key)).then();
					return res.status(422).json({ errors: [e.message] });
				}
				` `; // 	await mediaController.addMedia(req, res, uploadedFile.path);
			}

			res.status(200).send(result);
		},
	},
	{
		path: '/verify-token',
		method: 'post',
		validators: [checkSchema(FieldConfigs.validateAuth)],
		handler: (req: Request, res: Response) => {
			log.trace('POST /verify-token is up and running', req.body);
			// const data:{token: string,clientId: string } = req.body as any;
			// log.debug('token: ', data.token);
			// const {OAuth2Client} = require('google-auth-library');
			// const isAuthenticated = await googleJwtValidator(data.token);
			const err = validationResult(req);
			if (!err.isEmpty()) {
				log.error('res.code', res.statusCode);
				log.error('Bad Request', err.mapped());
				const e = err.mapped();
				if (e.token) res.status(401).send({ token: { ...e.token, value: undefined } });
				else res.status(400).send(e);
			} else {
				// No errors, pass req and res on to your controller
				res.sendStatus(200);
			}
		},
	},


	// popular items
	{
		path: '/popular-searches', // get place by id
		method: 'get',
		validators: [
			checkSchema(FieldConfigs.getPopularPlacesAndItems),
			// checkSchema(FieldConfigs.getPlaceSchemaConfig)
		],
		handler: async (req: Request, res: Response) => {
			// const err = validationResult(req);
			// if (!err.isEmpty()) {
			// 	log.error('Bad Request', err.mapped());
			// 	res.status(401).send(err.mapped());
			// } else {
				// No errors, pass req and res on to your controller
				log.info('in GET /popular-searches route handler');
				const args = {
					city:req.query.city as string,
					postcode:  req.query.postcode as string
				};
				// const city: string| undefined =
				// const
				try {
					const placeModel = await placeController.getTopPlaces(args);
					res.send(placeModel);
				} catch (error: any) {
					log.error('getting a popular places and items with args %s resulted in Error: ' ,args , error);
					if (error instanceof HTTP404Error) {
						res.status(404).send(error);
					} else {
						res.status(500).send(error);
					}
				}
				// res.send({...req.params,...req.query});
				// log.debug('Returning the fetched Place');
		},
	},

	// place routes
	{
		path: '/places/:placeId', // get place by id
		method: 'get',
		validators: [
			checkSchema(FieldConfigs.getPlaceByIdSchemaConfig),
			// checkSchema(FieldConfigs.getPlaceSchemaConfig)
		],
		handler: async (req: Request, res: Response) => {
			const err = validationResult(req);
			if (!err.isEmpty()) {
				log.error('Bad Request', err.mapped());
				res.status(401).send(err.mapped());
			} else {
				// No errors, pass req and res on to your controller
				log.debug('in get /places/:placeId route handler, processing request, req.params:', req.params);
				const placeId = req.params.placeId;
				try {
					const placeModel = await placeController.getAPlace(placeId);
					res.send(placeModel);
				} catch (error: any) {
					log.error('getting a place() -> Error while querying for a place with id: ' + placeId, error);
					if (error instanceof HTTP404Error) {
						res.status(401).send(err.mapped());
					} else {
						log.error('getting a place() -> Error while querying for a place with id: ' + placeId, error);
						res.status(500).send(error);
					}
				}
				// res.send({...req.params,...req.query});
				log.debug('Returning the fetched Place');
			}
		},
	},
	{
		path: '/places/', // get places by name or part of a name, takes name in query param
		method: 'get',
		validators: [
			checkSchema(FieldConfigs.getPlaceByNameSchemaConfig),
			// checkSchema(FieldConfigs.getPlaceSchemaConfig)
		],
		handler: async (req: Request, res: Response) => {
			const err = validationResult(req);
			if (!err.isEmpty()) {
				log.error('Bad Request', err.mapped());
				res.status(401).send(err.mapped());
			} else {
				// No errors, pass req and res on to your controller
				log.debug('in get /places/?placeName=<xyz> route handler, processing request, req.params:', req.params);
				const { placeName, itemName, postcode } = {
					...req.params,
					...req.query,
				} as any;
				await placeController.getPlaces({ placeName, itemName, postcode });
				// res.send({...req.params,...req.query});
				log.debug('Returning the fetched Place');
			}
		},
	},
	{
		path: '/places/:placeId/items', // adds an item/dish to a place.
		method: 'post',
		validators: [checkSchema(FieldConfigs.addItemSchemaConfig), checkSchema(FieldConfigs.validateAuth)],
		handler: async (req: Request, res: Response) => {
			const err = validationResult(req);
			if (!err.isEmpty()) {
				log.error('Bad Request', err.mapped());
				res.status(400).send(err.mapped());
			} else {
				// No errors, pass req and res on to your controller
				log.debug('in POST /places/:placeId/items route handler, processing request, req.body:: ', req.body);
				log.trace('Populate the placeId in the request body');
				req.body.place={
					id: req.params.placeId
				}
				try {
					const item = await placeController.addItem(req.body);
					// res.send({...req.params,...req.query});
					log.debug('Returning the fetched placeResponse: ', item);
					res.send(item);
				} catch (error: any) {
					log.error('creating an item in place resulted in Error', error);
					if (error instanceof HTTPClientError) {
						// res.sendStatus(404);//.send('Item not found');
						res.status(error.statusCode).send(error);

					// } else if (error instanceof HTTP400Error) {
					// 	res.status(400).send(error);
					} else {
						res.status(500).send({ message: error.message });
					}
				}
				// await placeController.addItem(req, res);
				log.debug('Done adding Place');
			}
		},
	},
	{
		path: '/places/:placeId/items/:itemId', // get a single item details from a given place
		method: 'get',
		validators: [checkSchema(FieldConfigs.getItemInPlaceByIdSchemaConfig)],
		handler: async (req: Request, res: Response) => {
			const err = validationResult(req);
			if (!err.isEmpty()) {
				log.error('Bad Request', err.mapped());
				res.status(401).send(err.mapped());
			} else {
				// No errors, pass req and res on to your controller
				log.debug('in get /places/:placeId/items/:itemId route handler, processing request, req.params:', req.params);
				const placeId = req.params.placeId;
				const itemId = req.params.itemId;
				try {
					const result: IPlaceItem | undefined = await itemController.getAItemInAPlace({ placeId, itemId });
					res.send(result);
				}  catch (error: unknown) {
					console.log('error::: ', error);
					if(error instanceof HTTP404Error) {
						log.error('Not found error:: ', error);
						res.status(404).send(error);
					} else {
						res.status(500).send(error);
					}
				}
				log.debug('Returning the fetched Place');
			}
		},
	},
	{
		path: '/places/:placeId/reviews', // get reviews of a place
		method: 'get',
		validators: [
			// checkSchema(FieldConfigs.getPlaceSchemaConfig)
		],
		handler: async (req: Request, res: Response) => {
			const err = validationResult(req);
			if (!err.isEmpty()) {
				log.error('Bad Request', err.mapped());
				res.status(401).send(err.mapped());
			} else {
				// No errors, pass req and res on to your controller
				log.debug('in get /places/:placeId/reviews route handler, processing request, req.params:', req.params);
				await reviewController.getReviews(req, res);
				log.debug('Returning the fetched reviews');
			}
		},
	},
	{
		path: '/places/:placeId/items/:itemId/reviews', // get reviews of an item in a given place
		method: 'get',
		validators: [
			// checkSchema(FieldConfigs.getPlaceSchemaConfig)
		],
		handler: async (req: Request, res: Response) => {
			const err = validationResult(req);
			if (!err.isEmpty()) {
				log.error('Bad Request', err.mapped());
				res.status(401).send(err.mapped());
			} else {
				// No errors, pass req and res on to your controller
				log.debug(
					'in get /places/:placeId/items/:itemId/reviews route handler, processing request, req.params:',
					req.params,
				);
				await reviewController.getReviews(req, res);
				log.debug('Returning the fetched reviews');
			}
		},
	},
	{
		path: '/places', // add a new place
		method: 'post',
		validators: [checkSchema(FieldConfigs.addPlaceSchemaConfig), checkSchema(FieldConfigs.validateAuth)],
		handler: async (req: Request, res: Response) => {
			const err = validationResult(req);
			if (!err.isEmpty()) {
				log.error('Bad Request', err.mapped());
				res.status(400).send(err.mapped());
			} else {
				// No errors, pass req and res on to your controller
				log.debug('in post /places route handler, processing request');
				await placeController.addPlace(req, res);
				log.debug('Done adding Place');
			}
		},
	},

	// items routes
	{
		path: '/items',
		method: 'post',
		validators: [checkSchema(FieldConfigs.createItemSchemaConfig), checkSchema(FieldConfigs.validateAuth)],
		handler: async (req: Request, res: Response) => {
			const err = validationResult(req);
			if (!err.isEmpty()) {
				log.error('Bad Request', err.mapped());
				res.status(400).send(err.mapped());
			} else {
				// No errors, pass req and res on to your controller
				log.info('in POST /items/ route handler, processing request, req.body:: ', req.body);
				try {
					await itemController.createItem(req, res);
				} catch (error: any) {
					log.error('POST /items/ resulted in Error', error);
					if (error instanceof HTTP404Error) {
						// return c.notFound();
						res.sendStatus(404);//.send('Item not found');
						// res.status(201).send(item);
					} else if (error instanceof HTTP400Error) {
						res.sendStatus(400);//.send('Item reference is mandatory');
					} else {
						res.status(500).send({message: error.message });
					}
				}
				log.debug('Done adding Place');
			}
		},
	},

	{
		path: '/items/:itemId', // Get an item by id. TODO why is it needed?
		method: 'get',
		validators: [checkSchema(FieldConfigs.getItemSchemaConfig)],
		handler: async (req: Request, res: Response) => {
			const err = validationResult(req);
			if (!err.isEmpty()) {
				log.error('Bad Request', err.mapped());
				res.status(400).send(err.mapped());
			} else {
				// No errors, pass req and res on to your controller
				log.debug('in getItem controller, processing request, req.body:: ', req.body);
				await itemController.getAItem(req, res);
				log.debug('Done getting an Item by given id');
			}
		},
	},

	// all about reviews routes
	{
		path: '/reviews', // create/post a new review
		method: 'post',
		validators: [checkSchema(FieldConfigs.postReviewSchemaConfig), checkSchema(FieldConfigs.validateAuth)],
		handler: async (req: Request, res: Response) => {
			const err = validationResult(req);
			if (!err.isEmpty()) {
				log.error('Bad Request', err.mapped());
				res.status(400).send(err.mapped());
			} else {
				// No errors, pass req and res on to your controller
				log.debug('in service.routes, post /reviews/,, processing request, req.body:: ', req.body);
				await reviewController.addReview(req, res);
				log.debug('Done adding a review');
			}
		},
	},
	{
		path: '/reviews/:reviewId', // fetch a review by id
		method: 'get',
		validators: [checkSchema(FieldConfigs.getReviewByIdSchemaConfig)],
		handler: async (req: Request, res: Response) => {
			const err = validationResult(req);
			if (!err.isEmpty()) {
				log.error('Bad Request', err.mapped());
				res.status(400).send(err.mapped());
			} else {
				// No errors, pass req and res on to your controller
				log.debug('in service.routes, get /reviews/:reviewId, processing request, req.body:: ', req.body);
				await reviewController.getAReview(req, res);
				log.debug('Done fetching a review');
			}
		},
	},
	{
		path: '/reviews', // like or update a review
		method: 'put',
		validators: [checkSchema(FieldConfigs.putReviewSchemaConfig)],
		handler: async (req: Request, res: Response) => {
			const err = validationResult(req);
			if (!err.isEmpty()) {
				log.error('Bad Request', err.mapped());
				res.status(400).send(err.mapped());
			} else {
				// No errors, pass req and res on to your controller
				log.debug('in service.routes, put /reviews/, processing request, req.body:: ', req.body);
				await reviewController.updateReview(req, res);
				log.debug('Done fetching a review');
			}
		},
	},

	// routes for medias
	{
		path: '/medias/upload',
		method: 'post',
		validators: [],
		handler: async (req: Request, res: Response) => {
			log.trace('Server is up and running');

			// const result = await r2Provider.listBuckets()
			/*let result = await r2FileUpload(req, res);
			result = await mediaService.addMultipleMedias(req,res);
			*/

			let result;
			try {
				result = await mediaController.uploadMultipleMedias(req, res);
			} catch (error: any){
				log.error('Uploading multiple medias resulted in error', error);
				return res.status(400).json(error);
			}
			// add the media file url into database
			if (Array.isArray(result)) {
				try {
					result = await mediaController.addMultipleMedias(req.body, result);
				} catch (e: any) {
					log.error('in service.routes, caught result: ', result);
					log.error('in service.routes, caught error: ', e);
					mediaController.removeUploadedMedias(result.map(o => o.Key)).then();
					return res.status(422).json({ errors: [e.message] });
				}
				// await mediaController.addMedia(req, res, uploadedFile.path);
			}

			res.status(200).send(result);
		},
	},
	{
		path: '/old/medias/upload',
		method: 'post',
		validators: [checkSchema(FieldConfigs.validateAuth)],
		handler: async (req: Request, res: Response) => {
			log.info('Request received in /medias/upload');
			let uploadResult;

			try {
				// upload media to s3 bucket
				uploadResult = await handleSingleUploadFile(req, res);
			} catch (e: any) {
				return res.status(422).json({ errors: [e.message] });
			}
			// get the file object after upload
			const uploadedFile: UploadedFile | UploadedFile[] = uploadResult.files;
			if (!uploadedFile) {
				return res.status(422).json({ errors: ['Looks like the file not accessible'] });
			}
			console.log('in POST /medias/upload, uploadedFile: ', uploadedFile);

			// const { body } = uploadResult;

			// add the media file url into database
			if (Array.isArray(uploadedFile)) {
				await mediaController.addMultipleMedias(req.body, uploadedFile);
			} else {
				await mediaController.addMedia(req, res, uploadedFile.path);
			}

			// return res.sendStatus(200);
		},
	},
	{
		path: '/medias/:id',
		method: 'delete',
		validators: [],
		handler: async (req: Request, res: Response) => {
			log.info('Received request to DELETE /medias/:id');
			let result;

			try {
				// delete the media file url into database
				await mediaController.deleteMedia(req, res);
			} catch (e: any) {
				return res.status(422).json({ errors: [e.message] });
			}

			// get the file object after upload
			// const uploadedFile: UploadedFile = uploadResult.file;
			// if (!uploadedFile) {
			// 	return res.status(422).json({ errors: ['Looks like the file not accessible'] });
			// }

			// const { body } = uploadResult;

			// return res.sendStatus(200);
		},
	},

	// Customers routes
	{
		path: '/customers/oidc-login',
		method: 'post',
		validators: [checkSchema(FieldConfigs.loginOrSignupOidcCustomerSchemaConfig), checkSchema(FieldConfigs.validateAuth)],
		handler: async (req: Request, res: Response) => {
			const err = validationResult(req);
			if (!err.isEmpty()) {
				log.error('Bad Request', err.mapped());
				res.status(401).send(err.mapped());
			} else {
				// No errors, pass req and res on to your controller
				log.debug('in POST /customers/oidc-login route handler, processing request');
				if (req.body.userInfo) {
					try{
						await customerController.loginCustomer(req, res);
					} catch (e: any) {
						log.error('in service.routes, caught error: ', e);
						return res.status(500).json({ errors: [e.message] });
					}
				}
				log.debug('Done creating a Customer record');
			}
		},
	},
	{
		path: '/customers',
		method: 'post',
		validators: [checkSchema(FieldConfigs.addCustomerSchemaConfig), checkSchema(FieldConfigs.validateAuth)],
		handler: async (req: Request, res: Response) => {
			const err = validationResult(req);
			if (!err.isEmpty()) {
				log.error('Bad Request', err.mapped());
				res.status(401).send(err.mapped());
			} else {
				// No errors, pass req and res on to your controller
				log.debug('in post /customers/ route handler, processing request');
				if (req.body.id) {
					await customerController.addCustomer(req, res);
				} else {
					await customerController.updateCustomer(req, res);
				}
				log.debug('Done creating a Customer record');
			}
		},
	},
	{
		path: '/customers/:customerId',
		method: 'put',

		validators: [checkSchema(FieldConfigs.getOrPutCustomerByIdSchemaConfig)],
		handler: async (req: Request, res: Response) => {
			const err = validationResult(req);
			if (!err.isEmpty()) {
				log.error('Bad Request', err.mapped());
				res.status(401).send(err.mapped());
			} else {
				// No errors, pass req and res on to your controller
				log.debug('in put /customers/:customerId route handler, processing request');
				await customerController.updateCustomer(req, res);
				log.debug('Updating completed');
			}
		},
	},
	{
		path: '/customers/:customerId',
		method: 'get',

		validators: [checkSchema(FieldConfigs.getOrPutCustomerByIdSchemaConfig)],
		handler: async (req: Request, res: Response) => {
			const err = validationResult(req);
			if (!err.isEmpty()) {
				log.error('Bad Request', err.mapped());
				res.status(401).send(err.mapped());
			} else {
				// No errors, pass req and res on to your controller
				log.debug('in get /customers/:customerId route handler, processing request');
				await customerController.getACustomerByIdOrEmail({ id: req.params.id });
				log.debug('Fetching completed');
			}
		},
	},
	{
		path: '/customers/',
		method: 'get',
		validators: [checkSchema(FieldConfigs.getCustomerByNameSchemaConfig)],
		handler: async (req: Request, res: Response) => {
			const err = validationResult(req);
			if (!err.isEmpty()) {
				log.error('Bad Request', err.mapped());
				res.status(401).send(err.mapped());
			} else {
				// No errors, pass req and res on to your controller
				log.debug('in get /customers/ route handler, processing request');
				await customerController.getCustomersByName(req, res);
				log.debug('Fetching completed');
			}
		},
	},
];
