import { IPlaceItem, PlaceItem } from '../entities/placeItem';
import { Logger } from 'log4js';
import { getLogger, simplify } from '../utils/Utils';
import { IPlace, Place } from '../entities/place';
import { PlaceItemRating } from '../entities/placeItemRating';
import { ItemModel } from '../models/itemModel';
import { Review } from '../entities/review';
import { Item } from '../entities/item';
import { Customer } from '../entities/customer';
import { IMedia } from '../entities/media';
import { PlaceModel } from '../models/placeModel';

const log: Logger = getLogger('placeItem.service');

export class PlaceItemService {
	//create a placeItem
	async addPlaceItem(data: IPlaceItem): Promise<IPlaceItem> {
		log.debug('Received request to create a PlaceItem');
		try {
			data.simpleName = simplify(data.name);
			data.createdAt = new Date();
			data.modifiedAt = new Date();
			log.trace('Creating PlaceItem with data: ', data);
			const newItem: IPlaceItem = await PlaceItem.create(data);
			log.trace('PlaceItem created successfully, returning data:: ', newItem);
			return PlaceItem.populate(newItem, 'item');
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
								course: {
									$first: '$item.course',
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
							course: 1,
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

	//get a single placeItem
	async getPlaceItemByNameAndPlace(args:{itemName: string, placeId: string}): Promise<IPlaceItem | undefined | null> {
		log.debug('Received request to get a placeItem by name: %s and placeId: %s', args.itemName, args.placeId);
		try {
			const placeItem: IPlaceItem|null = await PlaceItem.findOne(
				{ $or: 
					[
						{ name: {$regex: args.itemName, $options:'i'}},
						{ simpleName: {$regex: args.itemName, $options:'i'}},
					]
				,
				place:  args.placeId }).lean();
				
			if (!placeItem) {
				log.trace('PlaceItem not found by name: %s and placeId: %s', args.itemName, args.placeId);
				return undefined;
			}
			log.trace('Fetched a placeItem: ', placeItem);
			return placeItem;
		} catch (error) {
			log.error('Error while doing getPlaceItem  name: '+args.itemName+' and placeId: '+ args.placeId+'. Error: ', error);
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


	//update a PlaceItem
	async updatePlaceItemMedias(id: string, media: IMedia): Promise<IPlaceItem | null | undefined> {
		log.debug('Received request to add a media a IPlaceItem with id: ', id);

		try {
			//pass the id of the object you want to update
			//data is for the new body you are updating the old one with
			//new:true, so the dats being returned, is the update one
			// { $push: { medias: { $each: [media], $sort: -1, $slice: 3 } } },
			log.trace('Updating a IPlaceItem id: ' + id + ' with media: ', media);
			const placez: any = await PlaceItem.findByIdAndUpdate(
				{ _id: id },
				// { $push: { medias: { $each: [media], $sort: -1, $slice: 3 } } },
				{ media: media },
				{
					new: true,
				},
			);
			log.debug('Successfully updated the PlaceItem: ', placez);
			return placez;
		} catch (error) {
			log.error('Error while updating PlaceItem with id: ' + id + '. Error: ', error);
			throw error;
		}
	}

	//create ratings for items that are missing based on ubereats popularity string
	async createMissingRatings(): Promise<any | undefined> {
		log.debug('Received request to new rating');

		try {
			const placeItems: any[] = await PlaceItem.aggregate([
				{
					$match: 
					{
						uberPopularity: {
						$ne: null
						}
					}
				},
				{
					$lookup:
					{
						from: "place_item_ratings",
						localField: "_id",
						foreignField: "placeItem",
						as: "ratingInfo"
					}
				},
				{
					$unwind:
					{
						path: "$ratingInfo",
						preserveNullAndEmptyArrays: true
					}
				},
				{
					$match:
					{
						ratingInfo: {
						$exists: false
						}
					}
				}
				]);
			const noOfReviewsRegex = /\(([^)]+)\)/;
			const percentRegex = /\d+%/gi;
			// const allDuplicateIds: any[] = [];
			for(const pi of placeItems) {
				const ub = pi.uberPopularity;
				try{
					const noOfRatings = noOfReviewsRegex.exec(ub)?.[1];
					const percent = percentRegex.exec(ub)?.[0]?.replace('%','') ?? 0;
					// update PlaceItemRating table with this data for this placeItem
					const rating: any = {
						place: pi.place,
						placeItem: pi,
						noOfRatings: noOfRatings,
						noOfReviewPhotos: 0,
						taste: +percent/20,
						presentation: +percent/20,
						service: 0,
						ambience: 0,
						createdAt: new Date(),
						modifiedAt: new Date(),
					};
					log.trace('Creating new rating record %s', rating);
					await PlaceItemRating.create(rating);
				} catch(error){
					log.error('Error while creating placeItemRating entry. Error: ', error);
				}
			}
			return true;
		} catch (error) {
			log.error('Error while fetching list of placeItems that doesn\'t have entry in PlaceItemRating table.', error);
			return false;
		}
	}

	async setNoOfReviewsToNoOfRatings(): Promise<any | undefined> {
		log.debug('Received request to new rating');

		try {
			const placeItemsRatings: any[] = await PlaceItemRating.aggregate([
				{
				  $match: {
					  placeItem: {
						$ne: null
					  }
					}
				},
				{
				  $lookup: {
					  from: "place_items",
					  localField: "placeItem",
					  foreignField: "_id",
					  as: "pi",
					  pipeline: [
						{
						  $match: {
							uberPopularity: {
							  $ne: null
							}
						  }
						}
					  ]
					}
				},
				{
				  $unwind: {
					  path: "$pi",
					  preserveNullAndEmptyArrays: false
					}
				}
			  ]);
			
			  // const allDuplicateIds: any[] = [];
			for(const pr of placeItemsRatings) {
				const noOfReviews = pr.noOfReviews;
				try{
					pr.noOfRatings = noOfReviews;
					await PlaceItemRating.findByIdAndUpdate(pr._id, pr);
				} catch(error){
					log.error('Error while updating placeItemRating entry. Error: ', error);
				}
			}
			return true;
		} catch (error) {
			log.error('Error while fetching list of placeItemRatings to update their noOfRatings field.', error);
			return false;
		}
	}

	//create dietary category for the item
	async setItemCategories(): Promise<any | undefined> {
		log.debug('Received request to new categories for items');
		const veganCats =new RegExp(['Vegan','Plant'].join( "|" ), "i");
		const vegetarianCats =new RegExp( ['Veg','Vegetarian','sabzi','sabji','Vegetable','Vegetables',].join( "|" ), "i");
		const polloCats  =new RegExp(['Chicken', 'murg', 'murgh'].join( "|" ), "i");
		const lambCats =new RegExp(['lamb', 'goat'].join( "|" ), "i");
		const halalCats =new RegExp(['halal'].join( "|" ), "i");
		const pescoCats =new RegExp(['fish', 'prawn', 'prawns', 'shrimp', 'shrimps', 'Seafood'].join( "|" ), "i");
		const carnivoreCats =new RegExp(['non veg', 'non vegetarian', 'non-veg', 'non-vegetarian', 'carnivore', 'Wagyu','Beef','pork','bacon', 'rib','ribs','Donburi'].join( "|" ), "i");
		const indoCats =new RegExp(['Indo','desi'].join( "|" ), "i");

		try {
			log.trace('Set diet of item from item category or its name'); 
			let items: any[] = await PlaceItem.aggregate([{
				$match: {
				$or: [
					{ diet: {$lt: 1 } },
					{ diet: { $eq: null } }
				]
				}
			}]);	

			for (const item of items) {
				const cat = item.category;
				const name = item.name;
			
				if(veganCats.test(cat)|| veganCats.test(name)){
					item.diet = 1;
				} else if(carnivoreCats.test(cat) || carnivoreCats.test(name)){
					item.diet=9;
				} else if(halalCats.test(cat)||halalCats.test(name)){
					item.diet=7;
				}else if(lambCats.test(cat)|| lambCats.test(name)){
					item.diet=6;
				} else if(polloCats.test(cat)|| polloCats.test(name)){
					item.diet=5;
				} else if(pescoCats.test(cat)||pescoCats.test(name)){
					item.diet=4;
				} else if(vegetarianCats.test(cat) || vegetarianCats.test(name)){
					item.diet = 2;
				} else if(indoCats.test(cat)|| indoCats.test(name)){
					item.diet = 6;
				}
				if(item.diet){
					log.trace('Setting diet %s to item _id: %s', item.diet, item._id);
					await PlaceItem.findByIdAndUpdate(
						{ _id: item._id },
						item,
					);
				}
			}

			return true;
		} catch (error) {
			log.error('Error while fetching list of placeItems that doesn\'t have entry in PlaceItemRating table.', error);
			return false;
		}
	}

	async getPopulars(args?: {
		city?: string;
		postcode?: string;
		suburb?: string;
		diets?: string|number[];
		latitude?: number;
		longitude?: number;
		distance?: number;
	}): Promise<PlaceModel[] | undefined> {
		if (!args?.city) return undefined;
		log.debug('Received request to get top places with args: ', args);

		// create diets related match query
		args.diets = (args.diets as string)?.split(',').filter(Boolean).map(x => +x);

		let dietMatch: any = {$skip:0};
		if(args.diets?.length){
			dietMatch = { $match: { diet: {$in : args.diets} } }
		}

		// create address & location related match query
		let addressMatch: any = [{skip:0}];
		if(args.suburb || args.postcode) {
			addressMatch = [
				{ $match: {"address.city": {
					$regex: args.city ?? "sydney",
					$options: "i"
					}}
				},
				
			];
			if(args.suburb){
				addressMatch.push({ $match: {"address.suburb": {
					$regex: args.suburb,
					$options: "i"
					}}
				});
			}
			if(args.postcode){
				addressMatch.push({ $match: {"address.postcode": args.postcode}});
			}
		} else if(args.latitude && args.longitude){
			addressMatch = [{
					$set: {
						distance: {
						$let: {
							vars: {
							dlon: {
								$degreesToRadians: {
								$subtract: [
									{
									$toDouble:
										"$address.location.latitude"
									},
									+args.latitude
								]
								}
							},
							dlat: {
								$degreesToRadians: {
									$subtract: [
										{ $toDouble: "$address.location.longitude" },
										+args.longitude
									]
								}
							},
							lat1: {
								$degreesToRadians: { $toDouble: "$address.location.latitude" }
							},
							lat2: { $degreesToRadians: +args.latitude }
							},
							in: {
							// Haversine formula: sin²(dLat / 2) + sin²(dLon / 2)
							// cos(lat1)
							// cos(lat2);
							$add: [
								{
									$pow: [
										{ $sin: { $divide: ["$$dlat", 2] } },
										2
									]
								},
								{
								$multiply: [
									{
										$pow: [
											{ $sin: { $divide: ["$$dlon", 2] } },
											2
										]
									},
									{ $cos: "$$lat1" },
									{ $cos: "$$lat2" }
								]
								}
							]
							}
						}
						}
					}
				},
				{
					$set: {
					  distance: {
						// Distance in Meters given by "6372.8
						// 1000"
						$multiply: [
						  6372.8,
						  1000,
						  2,
						  {
							$asin: {
							  $sqrt: "$distance"
							}
						  }
						]
					  }
					}
				}, {$match: {
				 distance: {$lte: (!!args.distance ? ((+args.distance+1) * 1000 ) : 35000)}
			   	}}];
		}
		try {
			let popularItemsWithPlaces: any[] = await PlaceItem.aggregate([
				dietMatch,
				{
				  $lookup: {
					  from: "places",
					  localField: "place",
					  foreignField: "_id",
					  as: "place",
					  pipeline: [
						...addressMatch,
						{ $unset: "openingTimes._id" }
					  ]
					}
				},
				{
				  $unwind: {
					  path: "$place",
					  preserveNullAndEmptyArrays: false
					}
				},
				{
				  $lookup: {
					from: "place_item_ratings",
					localField: "_id",
					foreignField: "placeItem",
					pipeline: [
					  {
						$match: {
						  $expr: {
							$and:[
								{$ne: ["$placeItem", null]},
								{$gte: ["$noOfRatings", 30]}
								// {$placeItem: {$ne: null}},
								// {$noOfRatings: {$gte: 30}}
							]

						  }
						}
					  },
					  {
						$project: {
						  _id: 0
						}
					  }
					],
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
				  $sort: {
					  "ratingInfo.taste": -1,
					  "ratingInfo.presentation": -1
					}
				},
				{
				  $limit: 6
				}
			]);
			
			const popularPlaces: any[] = await Place.aggregate([
				...addressMatch,
				{ $unset: "openingTimes._id" },
				{
				  $lookup: {
					from: "place_item_ratings",
					localField: "_id",
					foreignField: "place",
					pipeline: [
					  {
						$match: {
						  $expr: {
							$eq: ["$placeItem", null]
						  }
						}
					  },
					  {
						$project: {  _id: 0 }
					  }
					],
					as: "ratingInfo"
				  }
				},
				{
				  $unwind: {
					path: "$ratingInfo",
					preserveNullAndEmptyArrays: false
				  }
				},
				{
				  $sort: {
					"ratingInfo.service": -1,
					"ratingInfo.ambience": -1
				  }
				},
				{ $limit: 2 }
			  ]);
			  popularItemsWithPlaces = popularItemsWithPlaces.concat(...popularPlaces);
			return popularItemsWithPlaces;
		} catch (error) {
			log.error('Error while getting popular places. Error: ', error);
			throw error;
		}
	}
}

//export the class
export const placeItemService = new PlaceItemService();
