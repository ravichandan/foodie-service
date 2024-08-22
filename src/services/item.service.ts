import { IItem, Item } from '../entities/item';
import { Logger } from 'log4js';
import { getLogger } from '../utils/Utils';
import { IPlaceItem, PlaceItem } from '../entities/placeItem';
import { Review } from '../entities/review';
import { PlaceItemRating } from '../entities/placeItemRating';
import { Place } from '../entities/place';
import { ItemModel } from '../models/itemModel';
import { HTTP400Error } from '../utils/error4xx';
import { Customer } from '../entities/customer';
// import { Query } from 'mongoose';

const log: Logger = getLogger('item.service');

export class ItemService {
	//create an item
	async createItem(itemData: IItem): Promise<IItem> {
		log.trace('In Item.Service-> createItem(), received request to create a Item: ', itemData);
		try {
			log.debug('In Item.Service-> createItem(), check if the item already exists in the inventory');
			const existing = await Item.findOne({ name: itemData.name, cuisines: itemData.cuisines });
			if (existing) {
				log.trace('Item with name and cuisine(s) already exists, returning it. item: ', existing);
				return existing;
			}
		} catch (error) {
			log.error(
				'Error while looking if an item exists with given name and cuisine. Will log the error and proceed with creating a new entry, Error: ',
				error,
			);
			// throw error;
		}

		try {
			itemData.createdAt = new Date();
			itemData.modifiedAt = new Date();
			log.trace('Creating Item with data: ', itemData);
			const newItem: IItem = await Item.create(itemData);
			log.trace('Item created successfully, returning data');
			return newItem;
		} catch (error) {
			log.error('Error while create a Item: ', error);
			throw error;
		}
	}

	//get all items
	async getItems(): Promise<IItem[] | undefined> {
		log.debug('Received request to getItems');
		try {
			const items = await Item.find({});
			log.trace('Returning fetched items');
			return items;
		} catch (error) {
			log.error('Error while doing getItems', error);
		}
	}

	//get a single item
	async getItem(id: string): Promise<IItem | undefined> {
		log.debug('Received request to get a item with id: ', id);
		try {
			const item = await Item.findById({ _id: id });
			if (!item) {
				log.trace('Item not found for id: ', id);
				return undefined;
			}
			log.trace('Fetched a Item id: ' + id + '. item: ', item);
			return item;
		} catch (error) {
			log.error('Error while doing getItem with id: ' + id + '. Error: ', error);
		}
	}

	//get a single item
	async getItemByNameOrAliases(args: { name: string, aliases: string[] }): Promise<IItem | undefined> {
		const { name, aliases } = { ...args };
		log.debug('Received request to get an item with aliases: ', aliases);
		const q: any = {};
		let li = null;
		if (!!args.name && !!args.aliases) {
			 li = [new RegExp(args.name, 'i')].push(...args.aliases.map(ali=> new RegExp(ali, 'i')));
		} else if(!!args.name) {
			li = [new RegExp(args.name, 'i')];
		} else if (!!args.aliases) {
			li = [args.aliases.map(ali=> new RegExp(ali, 'i'))];
		}
		q['name'] = { $in: li };
		q['aliases'] = { $in: li };
		
		try {
			const item = await Item.findOne(q).lean();
			if (!item) {
				log.trace('Item not found by given name or aliases');
				return undefined;
			}
			return item;
		} catch (error) {
			log.error('Error while doing getItem with given name or aliases: %s. Error: ', aliases, error);
			throw error;
		}
	}

	// remove this if 3 works
	async getItemsByName2(args: { itemName: string, postcode?: string; city?: string, suburb?: string }) {
		log.debug('Received request to get all items with args: ', args);
		if (!args.postcode && !args.city && !args.suburb) {
			log.error('Either postcode or city or suburb is mandatory to search items by name');
			return;
		}
		const q: any = {};
		if (!!args.postcode) {
			q['$address.postcode'] = +args.postcode;
		}
		if (!!args.city) {
			q['$address.city'] = args.city;
		}
		if (!!args.suburb) {
			q['$address.suburb'] = args.suburb;
		}
		try {
			const items: ItemModel[] = await Item.aggregate([

					{
						$match: {
							$or: [
								{ name: { $regex: args.itemName, $options: 'i' } },
								{ aliases: { $in: [new RegExp(`${args.itemName}`, 'i')] } },
							],
						},
					},
					{
						$lookup: {
							from: PlaceItem.collection.collectionName,
							localField: '_id', // field of reference to PlaceItem
							foreignField: 'item',
							as: 'place_items',
						},
					},

					{ $unwind: '$place_items' },
					{
						$lookup: {
							from: Place.collection.collectionName,
							localField: 'place_items.place', // field of reference to Place schema
							foreignField: '_id',
							pipeline: [
								{
									$match: {
										$expr: { $or: [...Object.entries(q).map(entry => ({ $eq: entry }))] },
									},
								},
							],
							as: 'places',
						},
					},
					{ $unwind: '$places' },
					{
						$addFields: {
							'places.items.description': '$place_items.description',
							'places.items.name': '$place_items.name',
							'places.items.id': '$place_items.id',
							// {
							// $arrayElemAt: [
							// 	'$place_items.name',
							// 0
							// ]
							// },
							// "items.itemColor": {
							// 	$arrayElemAt: [
							// 		"$itemColor.name",
							// 		0
							// 	]
							// }
						},
					},
					{
						$group:
							{
								_id: '$_id',
								places: {
									$push: '$places',
								},
								medias: {
									$push: '$media',
								},
								cuisines: {
									$first: '$cuisines',
								},
								course: {
									$first: '$course',
								},
								name: {
									$first: '$name',
								},
								description: {
									$first: '$description',
								},
							},
					},
					{
						$project: {
							_id: 1,
							places: 1,
							medias: 1,
							cuisines: 1,
							course: 1,
							name: 1,
							description: 1,
						},
					},
				],
			);
			log.trace('getItemsByName2:: , items:: ', items);
			// this.getItemsByName3(args);
			return items;
		} catch (error: any) {
			log.error('in error in getItemsbyName2, err:: ', error);
		}
	}

	// TODO remove this if getPlacesOfAnItem2 works
	async getPlacesOfAnItem(args: {
		itemId: string,
		itemName?: string,
		postcode?: string;
		city?: string,
		suburb?: string,
		size?: number,
		page?: number
	}) {
		log.debug('Received request to get all places of a given item with args: ', args);
		if (!args.postcode && !args.city && !args.suburb) {
			log.error('Either postcode or city or suburb is mandatory to search items by id');
			throw new HTTP400Error('Either postcode or city or suburb is mandatory to search items by id');
		}
		args.size = args.size ?? 10;
		args.page = args.page ?? 1;
		const q: any = {};
		if (!!args.postcode) {
			q['$address.postcode'] = +args.postcode;
		}
		if (!!args.city) {
			q['$address.city'] = args.city;
		}
		if (!!args.suburb) {
			q['$address.suburb'] = args.suburb;
		}
		try {
			const items: ItemModel[] = await PlaceItem.aggregate([
					{
						$match: {
							$expr: {
								$eq: [{ $toObjectId: args.itemId }, '$item'],
							},
						},
					},
					{
						$lookup: {
							from: Place.collection.collectionName,
							localField: 'place', // field of reference to Place schema
							foreignField: '_id',
							pipeline: [
								{
									$match: {
										$expr: { $or: [...Object.entries(q).map(entry => ({ $eq: entry }))] },
									},
								},
							],
							as: 'place',
						},
					},
					{
						$lookup: {
							from: Review.collection.collectionName,
							localField: '_id', // field of reference to PlaceItem
							foreignField: 'placeItem',
							pipeline: [
								{
									$lookup: {
										from: Customer.collection.collectionName,
										localField: 'customer', // field of reference to Place schema
										foreignField: '_id',
										as: 'customer',
									},
								},
								{
									$project: {
										customer: { $first: '$customer' },
										_id: 1,
										taste: 1,
										presentation: 1,
										service: 1,
										ambience: 1,
										description: 1,
										helpful: 1,
										notHelpful: 1,
										item: 1,
										place: 1,
										medias: 1,
										children: 1,
										parent: 1,

										// service: 1,
										// ambience: 1,
										// reviews: 1,
									},
								},
								{
									'$sort': { 'createdAt': -1 },
								}, {
									'$limit': args.size,
								}, {
									'$skip': (args.page - 1) * args.size,
								},
							],
							as: 'reviews',
						},
					},
					{
						$lookup: {
							from: PlaceItemRating.collection.collectionName,
							localField: '_id', // field of reference to PlaceItem
							foreignField: 'placeItem',
							as: 'rating',
						},
					},
					{
						$lookup: {
							from: Item.collection.collectionName,
							localField: 'item',
							foreignField: '_id',
							pipeline: [],
							as: 'item',
						},
					},
					{
						$set: {
							'item.course': '$item.course',
							'item.cuisine': '$item.cuisine',
							'item.name': '$name',
							'item.price': '$price',
							'item.description': '$description',
							'item.aliases': '$aliases',
							'item.taste': { $first: '$rating.taste' },
							'item.presentation': { $first: '$rating.presentation' },
							'item.noOfReviews': { $first: '$rating.noOfReviews' },
							'item.reviews': '$reviews',
							'item.id': '$_id',
						},
					},
					{
						$set: {
							'place.id': { $first: '$place._id' },
							'place.items': '$item',
							'place.name': { $first: '$place.placeName' },
							'place.service': { $first: '$rating.service' },
							'place.ambience': { $first: '$rating.ambience' },
							'place.noOfReviews': { $first: '$rating.noOfReviews' },
						},
					},
					{
						$group: {
							_id: '$_id',
							places: {
								// $first: {
								$first: '$place',
								// } ,
							},
							medias: {
								$push: '$item.media',
							},
							taste: {
								$first: {
									$first: '$taste',
								},
							},
							presentation: {
								$first: {
									$first: '$presentation',
								},
							},
							service: {
								$first: {
									$first: '$service',
								},
							},
							ambience: {
								$first: {
									$first: '$ambience',
								},
							},
							noOfReviews: {
								$first: {
									$first: '$noOfReviews',
								},
							},
							reviews: {
								$first: '$reviews',
							},
							items: {
								$first: '$item',
							},
							name: {
								$first: '$name',
							},
							description: {
								$first: '$description',
							},
						},

					},
					{
						$project: {
							_id: {
								$first: '$items._id',
							},
							places: 1,
							medias: {
								$first: '$medias',
							},
							name: 1,
							description: 1,
							// service: 1,
							// ambience: 1,
							// reviews: 1,
						},
					},
				],
			);
			log.trace('getPlacesOfAnItem:: , items:: ', items);
			const noOfReviewPhotos = await PlaceItem.aggregate([
					{
						$match: {
							$expr: {
								$eq: [{ $toObjectId: args.itemId }, '$item'],
							},
						},
					},
					/**
					 * from: The target collection.
					 * localField: The local join field.
					 * foreignField: The target join field.
					 * as: The name for the results.
					 * pipeline: Optional pipeline to run on the foreign collection.
					 * let: Optional variables to use in the pipeline field stages.
					 */
					{
						$lookup: {
							from: 'reviews',
							localField: '_id',
							foreignField: 'placeItem',
							as: 'reviews',
						},
					},

					{
						$unwind: {
							path: '$reviews',
							preserveNullAndEmptyArrays: false,
						},
					},
					{
						$match: {
							$expr: {
								$gt: [{ $size: '$reviews.medias' }, 0],
							},
						},
					},
				{
					$group: {
							_id: '$place',
							"reviews": {
								$push: '$reviews'
							}
						}
				},
					{
						$project: {
							// _id: 0,
							medias_count: { $size: '$reviews.medias' },
						},
					},
				],
			);
			log.trace('making test for noOfReviewPhotos:: ', noOfReviewPhotos);
			return items;
		} catch (error: any) {
			log.error('in error in getPlacesOfAnItem, err:: ', error);
			throw error;
		}
	}

	//get a single item TODO remove this
	async getAPlaceItem(params: { placeId?: string; itemId?: string, placeItemId?: string }): Promise<IPlaceItem | undefined> {
		log.debug('item.service -> getAPlaceItem, received request to get an item with params: ', params);
		try {
			let item;
			if(!!params.placeItemId){
				item = await PlaceItem.findOne({  _id: params.placeItemId }).populate({
					path: 'reviews rating medias',
					options: { sort: { createdAt: -1 }, limit: 20 },
				});
			} else if(params.placeId && params.itemId){
				item = await PlaceItem.findOne({ place: { _id: params.placeId }, item: { _id: params.itemId } }).populate({
					path: 'reviews rating medias',
					options: { sort: { createdAt: -1 }, limit: 20 },
				});
			}
			if (!item) {
				log.trace('Item not found for params: ', params);
				return undefined;
			}
			log.trace('Fetched a Item params: ' + params + '. item: ', item);
			return item;
		} catch (error) {
			log.error('Error while doing getItem with params: ' + params + '. Error: ', error);
			throw error;
		}
	}

	//update a item
	async updateItem(id: number, data: any): Promise<IItem | null | undefined> {
		log.debug('Received request to update a item with id: ', id);

		try {
			//pass the id of the object you want to update
			//data is for the new body you are updating the old one with
			//new:true, so the dats being returned, is the update one
			log.trace('Updating a item id: ' + id + ' with data: ', data);
			const itemz = await Item.findByIdAndUpdate({ _id: id }, data, {
				new: true,
			});
			log.debug('Successfully updated the Item: ', itemz);
			return itemz;
		} catch (error) {
			log.error('Error while updating Item with id: ' + id + '. Error: ', error);
		}
	}

	//delete a item by using the find by id and delete
	async deleteItem(id: string): Promise<IItem | undefined> {
		log.debug('Received request to delete a item with id: ', id);

		try {
			const item = await Item.findByIdAndDelete(id);
			if (!item) {
				log.trace('Delete failed, Item with id: ' + id + ' not found');
				return undefined;
			}
			log.trace('Item with id: ' + id + ' deleted successfully');
			return item;
		} catch (error) {
			log.error('Error while deleting Item with id: ' + id + '. Error: ', error);
		}
	}
}

//export the class
export const itemService = new ItemService();
