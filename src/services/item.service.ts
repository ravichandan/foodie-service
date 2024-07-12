import { IItem, Item } from '../entities/item';
import { Logger } from 'log4js';
import { getLogger } from '../utils/Utils';
import { IPlaceItem, PlaceItem } from '../entities/placeItem';
import { Review } from '../entities/review';
import { PlaceItemRating } from '../entities/placeItemRating';
import { Media } from '../entities/media';
import { Place } from '../entities/place';
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
	async getItemByAliases(aliases: string[]): Promise<IItem | undefined> {
		log.debug('Received request to get an item with aliases: ', aliases);
		try {
			const item = await Item.findOne({ aliases: { $in: aliases } });
			if (!item) {
				log.trace('Item not found by given aliases');
				return undefined;
			}
			return item;
		} catch (error) {
			log.error('Error while doing getItem with given aliases: %s. Error: ', aliases, error);
			throw error;
		}
	}

	async getItemsByName(args: { itemName: string, postcode?: string; city?: string, suburb?: string }) {
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
			const items: IPlaceItem[] = await PlaceItem.aggregate([
				{
					$lookup: {
						from: Review.collection.collectionName,
						localField: '_id', // field of reference to PlaceItem
						foreignField: 'item',
						// let: {
						// 	pl: "$place"
						// },
						pipeline: [
							{
							// 	$match: {
							// 		$expr: {
							// 				$eq: [ "$taste", 0.05 ]
							// 		}
							// 	}
							// }, {
								'$sort': {  'createdAt': -1 }
							}, {
								'$limit': 20
							},
						],
						as: 'reviews',
					},
				},
				{
					$lookup: {
						from: PlaceItemRating.collection.collectionName,
						localField: '_id', // field of reference to PlaceItem
						foreignField: 'item',
						// let: {
						// 	place: "$place"
						// },
						pipeline: [
							{
							// 	$match: {
							// 		$expr: {
							// 			$eq: [ "$place", "$$place" ]
							// 		}
							// 	}
							// }, {
								'$sort': {  'createdAt': -1 }
							}, {
								'$limit': 20
							},
						],
						as: 'ratings',
					},
				},
				{
						$lookup: {
							from: Item.collection.collectionName,
							localField: 'item', // field of reference to Item schema
							foreignField: '_id',
							pipeline: [
								// {
								// 	$lookup: {
								// 		from: Media.collection.collectionName,
								// 		localField: 'media', // field of reference to Place schema
								// 		foreignField: '_id',
								// 		as: 'media'
								// 	}
								// },
								{ $project: { _id: 0, createdAt: 0, modifiedAt: 0 } }

							],
							as: 'item'
						}
				},
				{
					$lookup: {
						from: Place.collection.collectionName,
						localField: 'place', // field of reference to Place schema
						foreignField: '_id',
						pipeline: [
							{
								$match: {
									$expr:{$or: [...Object.entries(q).map(entry => ({$eq: entry}))] },
								}
							},
						],
						as: 'places'
					}
				},
				{
					$match: {
						$or: [
							{ name: { $regex: args.itemName, $options: 'i' } },
							{ 'item.aliases': { $in: [new RegExp(`${args.itemName}`, 'i')] } },
						],
					},
				},
				{
					$project: {
						_id:1,
						name: 1							,
						details:{
							$first: '$item'
						},
						// item:1,
						description: 1,
						places: 1,
						reviews: 1,
						ratings: 1
					}
				}
				]);
				// .populate({
				// 	path: 'reviews ratings medias',
				// 	options: { sort: { createdAt: -1 }, limit: 20 },
				// });
			if (!items) {
				log.trace('Item not found for params: ', args);
				return undefined;
			}
			log.trace('Fetched Items with given params: ' + args + '. items: ', items);
			return items;
		} catch (error) {
			log.error('Error while doing getItem with params: ' + args + '. Error: ', error);
			throw error;
		}
	}

	//get a single item
	async getAPlaceItem(params: { placeId: string; itemId: string }): Promise<IPlaceItem | undefined> {
		log.debug('Received request to get a item with params: ', params);
		try {
			log.debug('PlaceITem:: ', PlaceItem);
			log.debug('PlaceITem:: ', PlaceItem.find);
			const item = await PlaceItem.findOne({ place: { _id: params.placeId }, item: { _id: params.itemId } }).populate({
				path: 'reviews ratings medias',
				options: { sort: { createdAt: -1 }, limit: 20 },
			});
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
