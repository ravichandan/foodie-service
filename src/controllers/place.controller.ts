//import modules
import { placeService } from '../services/place.service';
import { Request, Response } from 'express';
import { IPlace, Place } from '../entities/place';
import { mediaService } from '../services/media.service';
import { IMedia } from '../entities/media';
import * as Utils from '../utils/Utils';
import { Logger } from 'log4js';
import { PlaceModel, PlaceResponse } from '../models/placeModel';
import { IItem } from '../entities/item';
import { itemService } from '../services/item.service';
import { IPlaceItem } from '../entities/placeItem';
import { placeItemService } from '../services/placeItem.service';
import { placeToPlaceModel } from '../utils/Utils';

const log: Logger = Utils.getLogger('place.controller');

class PlaceController {
	//add place controller
	addPlace = async (req: Request, res: Response) => {
		// check('name').isLength({ min: 3 }).trim().escape(),
		//     check('email').isEmail().normalizeEmail(),
		//     check('age').isNumeric().trim().escape()

		//data to be saved in database
		log.trace('Adding correlationId into the request body');
		const data: IPlace = {
			correlationId: req.header('correlationId'),
			...req.body,
		};
		//call the create place function in the service and pass the data from the request
		try {
			log.trace('Creating a Place with given data');
			let place: IPlace | null | undefined = await placeService.createPlace(data);
			if (place.medias.length < 1) {
				try {
					// update Media document if it exists.
					log.trace('Fetching Media document with correlationId: ', place.correlationId);
					const media: IMedia | null = await mediaService.getMedia({
						correlationId: place.correlationId,
					});
					if (!!media) {
						log.trace('Fetched Media document with correlationId: %s, media -> _id: %s', place.correlationId, media?._id);
						log.trace('Adding placeId and customerId to Media document with _id: %s', place.correlationId, media?._id);
						await mediaService.updateMedia(media._id, {
							placeId: place._id,
							customerId: place.customerId,
						});
						log.trace('Updating Place document with _id: %s to add to medias array', place._id);
						place = await placeService.updatePlaceMedias(place._id, media);
					} else {
						log.error('Couldn\'t find any media with this correlationId: ', place.correlationId);
					}
				} catch (error: any) {
					log.error('Error while updating Media document with Place id: ' + place?._id, error);
				}
			}
			if (!place) {
				log.info('Place not created due to previous errors, returning 404');
				res.status(404).send('Place could not be added');
			} else {
				log.info('Place created successfully, returning the new object');
				res.status(201).send(place);
			}
		} catch (error: any) {
			log.error('Error while creating place with given data. Error: ', error);
			res.send(error.message);
		}
	};

	/**
	 * API Controller method for 'get all places'. This takes atleast one of placeName or postcode, with pagination params
	 */
	getPlaces = async (req: Request, res: Response) => {
		log.info('Received request in getPlaces');
		const { placeName, itemName, postcode }: { placeName: string; itemName?: string; postcode: string } = {
			...req.params,
			...req.query,
		} as any;

		log.trace('Params to getPlaces: ', { placeName, itemName, postcode });
		const places: IPlace[] | undefined = await placeService.getPlaces({ placeName, postcode });
		log.trace('Found the following places with given params', places);
		if (!places) {
			res.status(404).send('No places found with given criteria');
			return;
		}
		if (places.length > 2) {
			let placeResponse: PlaceResponse = {
				places: Utils.placesToPlaceModels(places),
				size: places.length,
				page: 0,
			};
			// res.send(places); // TODO
			// return;
		}

		log.trace('Only one place found with given criteria, loading its items, reviews and ratings recursively');
		await Place.populate(places, [
			{ path: 'reviews ratings', options: { sort: { 'createdAt': -1 }, perDocumentLimit: 5 } },
			{
				path: 'items',
				populate: { path: 'reviews ratings', options: { sort: { 'createdAt': -1 }, perDocumentLimit: 5 } },
				match: (place: IPlace, virtual: any) => ({
					...(!!itemName && { localName: { $regex: itemName, $options: 'i' } }),
				}),
			}]);

		log.trace('Loaded all properties for the place, ', places);

		let placeResponse: PlaceResponse = {
			places: Utils.placesToPlaceModels(places),
			size: 1,
			page: 1,
		};
		console.log('placeResponse:: ', placeResponse);
		res.send(placeResponse);
	};

	//get a single place
	getAPlace = async (req: Request, res: Response) => {
		//get id from the parameter
		const id = req.params.placeId;
		log.debug('Querying for a place with id: ', id);
		try {
			const place = await placeService.getPlace(id);
			log.trace('Place found with given id, place: ', place);
			if(!place) {
				res.sendStatus(404);
				return;
			}
			const placeModel: PlaceModel = placeToPlaceModel(place);
			res.send(placeModel);
		} catch (error: any) {
			log.error('getting a place() -> Error while querying for a place with id: ' + id, error);
			res.status(500).send(error);
		}
	};

	//update place
	updatePlace = async (req: Request, res: Response) => {
		const id = +req.params.id;
		const place = await placeService.updatePlace(id, req.body);
		res.send(place);
	};

	//delete a place
	deletePlace = async (req: Request, res: Response) => {
		const id = req.params.id;
		await placeService.deletePlace(id);
		res.send('place deleted');
	};

	addItem = async (req: Request, res: Response) => {
		log.info('Received request in PlaceController->addItem() to add the given Item to the given place')
		//data to be saved in database
		// log.debug('Adding correlationId into the request body');
		const data: IPlaceItem = req.body;
		if(!data.item){
			log.error('Item reference is mandatory');
			res.status(400).send('Item reference is mandatory');

		}
		// data.category= ItemCategory[req.body.category.toUpperCase() as ItemCategory];
		// data.cuisines= [...req.body.cuisines.map((c: any) => Cuisine[c.toUpperCase() as Cuisine])];
		// const { itemReferenceId, ...itemData } = { ...data };
		// delete data.itemReferenceId;;
		//call the create item function in the service and pass the data from the request
		log.trace('Validating Item reference in the request ');
		try {
			let item: IItem | undefined;
			if(!data.item.id){
				log.info('Item is not found in inventory, creating it');
				item = await itemService.createItem(data.item);
				log.trace('Item created successfully in the inventory');
			} else {
				item = await itemService.getItem(data.item.id);
				log.trace('Item found with id: ',data.item.id);
			}
			log.trace('Looking for the place with id: ', data.place?.id);

			// create PlaceItem mapping
			const place: IPlace | undefined = await placeService.getPlace(data.place?.id);
			if (!place) {
				log.error('No Place found with the given placeId: ', data.place?.id);
			}
			if (place && item) {
				const placeItemData: IPlaceItem = {
					place: place,
					item: item,
					name: data.name,
					description: data.description,
					medias: [...data.medias],
				} as IPlaceItem;
				log.trace('Adding PlaceItem document with data: ', placeItemData);
				await placeItemService.addPlaceItem(placeItemData);
				log.trace('Successfully added PlaceItem document.');
			}

			if (!item) {
				log.info('Item not created due to previous errors, returning 404');
				res.status(404).send('Item not found');
			} else {
				log.info('Item created successfully, returning the new object');
				res.status(201).send(item);
			}
		} catch (error: any) {
			log.error('Error while adding Item to Place with given data. Error: ', error);
			res.send(error.message);
		}
	}
}

//export class
export const placeController = new PlaceController();
