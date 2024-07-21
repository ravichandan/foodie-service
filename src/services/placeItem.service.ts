import { IPlaceItem, PlaceItem } from '../entities/placeItem';
import { Logger } from 'log4js';
import { getLogger } from '../utils/Utils';
import { IPlace, Place } from '../entities/place';
import { PlaceItemRating } from '../entities/placeItemRating';
import { ItemModel } from '../models/itemModel';
import { Review } from '../entities/review';
import { IItem, Item } from '../entities/item';
import { Customer } from '../entities/customer';

const log: Logger = getLogger('placeItem.service');

export class PlaceItemService {
	//create a placeItem
	async addPlaceItem(data: IPlaceItem): Promise<IPlaceItem> {
		log.debug('Received request to create a PlaceItem');
		try {
			data.createdAt = new Date();
			data.modifiedAt = new Date();
			log.trace('Creating PlaceItem with data: ', data);
			const newItem: IPlaceItem = await PlaceItem.create(data);
			log.trace('PlaceItem created successfully, returning data');
			return newItem;
		} catch (error) {
			log.error('Error while create a PlaceItem: ', error);
			throw error;
		}
	}

	//get all PlaceItems
	// not yet used
	async getPlaceItems(): Promise<IPlaceItem[] | undefined> {
		log.debug('Received request to getPlaceItems');
		try {
			const items = await PlaceItem.find({});
			log.trace('Returning fetched items');
			return items;
		} catch (error) {
			log.error('Error while doing getPlaceItems', error);
		}
	}

	//get all placeItems of given place
	// not yet used
	async getPlaceItemsByPlace(place: IPlace): Promise<IPlaceItem[] | undefined | any> {
		log.info('Received request to getPlaceItems by given Place. place: ', place);
		try {
			const items: IPlaceItem[] = await PlaceItem.find({ place: { _id: place._id } })
				.populate('place')
				.populate('item');
			log.trace('Returning fetched items, items: ', items);
			return items;
		} catch (error) {
			log.error('Error while doing getPlaceItems', error);
		}
	}


	async getPlacesOfAnItem2(args: { itemId: string, itemName?: string, postcode?: string; city?: string, suburb?: string }) {
		log.debug('Received request to get all places of a given itemId, args: ', args);
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
								}
							],
							as: 'place',
						},
					},
					{ $unwind: { path: '$place', preserveNullAndEmptyArrays: false } },
					{
						$lookup: {
							from: PlaceItemRating.collection.collectionName,
							localField: '_id', // field of reference to Place schema
							foreignField: 'placeItem',
							as: 'ratingInfo',
						},
					},
					{ $unwind: { path: '$ratingInfo', preserveNullAndEmptyArrays: true } },
					{
						$lookup: {
							from: Review.collection.collectionName,
							localField: '_id', // field of reference to Place schema
							foreignField: 'placeItem',
							pipeline: [
								{
									$lookup: {
										from: Customer.collection.collectionName,
										localField: 'customer', // field of reference to Place schema
										foreignField: '_id',
										pipeline: [
											{
												$project: {
													_id: 0,
													'name': 1,
													'status': 1
												}
											}
										],
										as: 'customer'
									},

								},
								{
									$unwind:{
										path: '$customer',
										preserveNullAndEmptyArrays: true
										}
								},
							],
							as: 'review',
						},
					},
					{ $unwind: { path: '$review', preserveNullAndEmptyArrays: true } },
				{
					$lookup: {
						from: Item.collection.collectionName,
						localField: 'item', // field of reference to Place schema
						foreignField: '_id',
						as: 'item',
					},
				},
				{ $unwind: { path: '$item', preserveNullAndEmptyArrays: true } },

				{
						$group:
							{
								_id: '$_id',
								// _id: {
								// 	// '$place_item._id',
								// 	place_item: '$_id',
								// 	place: '$place',
								// },
								itemId: {
									$first: '$item._id',
								},
								placeItemId: {
									$first: '$_id',
								},
								name: {
									$first: '$name',
								},
								ingredients: {
									$first: '$ingredients',
								},
								description: {
									$first: '$description',
								},
								price: {
									$first: '$price',
								},
								cuisines: {
									$first: '$item.cuisines',
								},
								category: {
									$first: '$item.category',
								},
								noOfReviews: {
									$sum: 1,
								},
								totalNoOfReviews: {
									$first: '$ratingInfo.noOfReviews',
								},
								noOfReviewPhotos: {
									$sum: {
										$cond: [
											{
												$eq: [
													{ $type: '$review.medias' },
													'missing',
												],
											},
											0,
											{ $size: '$review.medias' },
										],
									},
								},
								originalName: {
									$first: {
										$cond: [
											{
												$eq: [
													args.itemName,
													null,
												],
											},
											'$item.name',
											args.itemName,
										],
									}
								},
								reviews: {
									$push: '$review',
								},
								place: {
									$push: '$place',
								},
								ratingInfo: {
									$first: '$ratingInfo',
								},
							},
					},
					{
						$project: {
							_id: '$itemId',
							placeItemId: 1,
							name: 1,
							ingredients: 1,
							description: 1,
							price: 1,
							cuisines: 1,
							category: 1,
							noOfReviews: 1,
							totalNoOfReviews: 1,
							noOfReviewPhotos: 1,
							reviews: 1,
							places: {
								$slice: ['$place',1],
							},
							ratingInfo: 1,
							originalName: 1
						},
					},
				],
			);
			log.trace('getItemsByName3:: , items:: ', JSON.stringify(items));
			return items;
		} catch (error: any) {
			log.error('in error in getItemsbyName3, err:: ', error);
		}
	}


// TODO remove
	async getAnItemInAPlace(params: { placeId?: string; itemId?: string, placeItemId?: string, page? : number, size?: number }): Promise<ItemModel[] | undefined> {
		log.debug('item.service -> getAPlaceItem2, received request to get an item with params: ', params);
		try {
			let match: any;
			if(!!params.placeItemId){
				match= {
					$expr: {
				 		$eq: [{ $toObjectId: params.placeItemId }, '$_id'] ,
					}
						// _id: { $toObjectId: params.placeItemId }
				};

			} else if (params.placeId && params.itemId) {
				match= {
					$expr: {
						$and: [
							{ $eq: [{ $toObjectId: params.placeId }, '$place'] },
							{ $eq: [{ $toObjectId: params.itemId }, '$item'] },
						],
						// place: { $toObjectId: params.placeId },
						// item: { $toObjectId: params.itemId }
					}
				}
			}

			// $expr: {
			// 	$eq: [{ $toObjectId: args.itemId }, '$item'],
			// },
			const items: ItemModel[] = await PlaceItem.aggregate([
				{
					$match: match
				},
				{
					$lookup: {
						from: 'places',
						localField: 'place',
						foreignField: '_id',
						as: 'place'
					}
				},
				{
					$unwind: {
						path: '$place',
						preserveNullAndEmptyArrays: false
					}
				},
				{
					$lookup: {
						from: "items",
						localField: "item",
						foreignField: "_id",
						as: "item"
					}
				},
				{
					$unwind: {
						path: "$item",
						preserveNullAndEmptyArrays: true
					}
				},
				{
					$lookup: {
						from: "place_item_ratings",
						localField: "_id",
						foreignField: "placeItem",
						as: "ratingInfo"
					}
				},
				{
					$unwind: {
						path: "$ratingInfo",
						preserveNullAndEmptyArrays: true
					}
				},
				{
					$lookup: {
						from: "reviews",
						localField: "_id",
						foreignField: "placeItem",
						pipeline: [
							{
								$sort: {
									createdAt: -1
								}
							},
							{
								$skip: ((params.page ?? 1) - 1) * (params.size ?? 5)
							},
							{
								$limit: (params.size ?? 5)
							}

						],
						as: "reviews"
					}
				}
			]);
			if (!items) {
				log.trace('Item not found for params: ', params);
				return undefined;
			}
			log.trace('Fetched a Item params: ' + params + '. items: ', items);
			return items;
		} catch (error) {
			log.error('Error while doing getItem with params: ' + params + '. Error: ', error);
			throw error;
		}
	}

	//get a single placeItem
	// not yet used
	async getPlaceItem(id: string): Promise<IPlaceItem | undefined> {
		log.debug('Received request to get a placeItem with id: ', id);
		try {
			const placeItem = await PlaceItem.findById({ _id: id });
			if (!placeItem) {
				log.trace('PlaceItem not found for id: ', id);
				return undefined;
			}
			log.trace('Fetched a PlaceItem id: ' + id + '. placeItem: ', placeItem);
			return placeItem;
		} catch (error) {
			log.error('Error while doing getPlaceItem with id: ' + id + '. Error: ', error);
		}
	}

	//update a placeItem
	// not yet used
	async updatePlaceItem(id: number, data: any): Promise<IPlaceItem | null | undefined> {
		log.debug('Received request to update a placeItem with id: ', id);

		try {
			//pass the id of the object you want to update
			//data is for the new body you are updating the old one with
			//new:true, so the dats being returned, is the update one
			log.trace('Updating a placeItem id: ' + id + ' with data: ', data);
			const itemz = await PlaceItem.findByIdAndUpdate({ _id: id }, data, {
				new: true,
			});
			log.debug('Successfully updated the PlaceItem: ', itemz);
			return itemz;
		} catch (error) {
			log.error('Error while updating PlaceItem with id: ' + id + '. Error: ', error);
		}
	}

	//delete a placeItem by using the find by id and delete
	// not yet used
	async deletePlaceItem(id: string): Promise<IPlaceItem | undefined> {
		log.debug('Received request to delete a placeItem with id: ', id);

		try {
			const placeItem = await PlaceItem.findByIdAndDelete(id);
			if (!placeItem) {
				log.trace('Delete failed, PlaceItem with id: ' + id + ' not found');
				return undefined;
			}
			log.trace('PlaceItem with id: ' + id + ' deleted successfully');
			return placeItem;
		} catch (error) {
			log.error('Error while deleting PlaceItem with id: ' + id + '. Error: ', error);
		}
	}
}

//export the class
export const placeItemService = new PlaceItemService();
