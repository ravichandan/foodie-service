import { IPlace, Place } from '../entities/place';
import { Logger } from 'log4js';
import { deduceCityName, getLogger, simplify, cleanPlaceName } from '../utils/Utils';
import { IMedia } from '../entities/media';
import { PlaceModel } from '../models/placeModel';
import { Customer } from '../entities/customer';
import { HTTP404Error } from '../utils/error4xx';
import { config } from '../config/config';
import { suburbService } from './suburb.service';
import { IPlaceItemRating, PlaceItemRating } from '../entities/placeItemRating';

const log: Logger = getLogger('place.service');

export class PlaceService {

	//create a place
	async createPlace(placeData: IPlace, rating?: string, noOfRatings?: string): Promise<IPlace> {
		log.debug('Received request to create a Place');
		try {
			placeData.createdAt = new Date();
			placeData.modifiedAt = new Date();
			// placeData.placeName=placeData.placeName.replace(placeData.address.suburb,'');
			placeData.simpleName = simplify(placeData.placeName);
			placeData.address.city = deduceCityName(placeData.address);

			log.trace('Creating Place with data: ', placeData);
			const newPlace: IPlace = await Place.create(placeData);
			await Place.populate(newPlace, 'openingTime');
			log.trace('Place created successfully, returning data');
			if(rating){
				const ratingData: any = {
					place: newPlace,
					noOfRatings: noOfRatings,
					noOfReviewPhotos: 0,
					taste: null,
					presentation: null,
					service: rating,
					ambience: rating,
					createdAt: new Date(),
					modifiedAt: new Date(),
				  } ;
				await PlaceItemRating.create(ratingData);
				log.trace('Added rating for the place');
			}
			return newPlace;
		} catch (error) {
			log.error('Error while create a Place: ', error);
			throw error;
		}
	}

	async getPlaces(params?: {
		placeName?: string;
		itemName?: string;
		postcode?: string;
		city?: string;
		suburbs: string[];
		pageSize?: number;
		pageNumber?: number;
		latitude?: number;
		longitude?: number;
		distance?: number;
	}): Promise<PlaceModel[] | undefined> {
		log.info('Received request to getPlaces, params: ', params);

		const prams: { pageSize: number; pageNumber: number } = {
			...params,
			pageNumber: params?.pageNumber ?? 1,
			pageSize: params?.pageSize ?? 3,
		};
		if(params?.placeName){
			params.placeName = simplify(params.placeName);
		}
		log.trace('Received request to getPlaces, prams: ', prams);

		let query: any[] = [];


		// create address & location related match query
		let addressMatch: any = [{skip:0}];
		if(params?.longitude && params?.latitude){
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
									+params?.latitude
								]
								}
							},
							dlat: {
								$degreesToRadians: {
									$subtract: [
										{ $toDouble: "$address.location.longitude" },
										+params?.longitude
									]
								}
							},
							lat1: {
								$degreesToRadians: { $toDouble: "$address.location.latitude" }
							},
							lat2: { $degreesToRadians: +params?.latitude }
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
				 distance: {$lte: (!!params?.distance ? ((+params?.distance+1) * 1000 ) : 35000)}
			   	}}];
		} else {
			addressMatch = [
				{ $match: {"address.city": {
					$regex: params?.city ?? "sydney",
					$options: "i"
					}}
				},
			];
			if(params?.suburbs){
				// addressMatch.push({ $match: { 'address.suburb': new RegExp(`(${params.suburbs.join('|')})`, 'i')}});
				addressMatch.push({ $match: { 'address.suburb': {$regex: `(${params.suburbs.join('|')})` , $options: 'i'}}});
			}

			if(params?.postcode){
				addressMatch.push({ $match: {"address.postcode": params?.postcode}});
			}
		}
		// if (!!params?.postcode) {
		// 	query.push({ $match: { 'address.postcode': +params?.postcode } });
		// }
		// if (!!params?.city) {
		// 	query.push({ $match: { 'address.city': { $regex: params?.city, $options: "i" }}});
		// }
		// if (!!params?.suburbs) {
		// 	log.trace('debugging testtt ', { 'address.suburb': new RegExp(`(${params.suburbs.join('|')})`, 'i') });
		// 	query.push({ $match: { 'address.suburb': new RegExp(`(${params.suburbs.join('|')})`, 'i')
		// 	}});
		// }
		query.push(...addressMatch);
		log.trace('debuggingggg:: query:: ', JSON.stringify(query));
		// if(!!params?.itemName) {
		query.push(
			{
				$lookup: {
					from: 'place_items',
					localField: '_id',
					foreignField: 'place',
					pipeline: !!params?.itemName ? [   
						{
							$lookup: {
								from: 'place_item_ratings',
								localField: '_id',
								foreignField: 'placeItem',
								as: 'ratingInfo',
							},
						},
						{
							$unwind: {
								path: '$ratingInfo',
								preserveNullAndEmptyArrays: true,
							},
						},
						{
							$set:{
								'medias': '$media',
							},
						}
					] : [],
					as: 'placeItems',
				},
			},
			{
				$unwind: {
					path: '$placeItems',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$lookup: {
					from: 'items',
					localField: 'placeItems.item',
					foreignField: '_id',
					as: 'items',
				},
			});
		// }

		// { name: { $regex: '\\b('+args.itemName+')\\b', $options: 'i' } },
		// 						{ aliases: { $in: [new RegExp(`\\b(${args.itemName})\\b`, 'i')] } },
		query.push({
			$match: {
				$or: !!params?.itemName ? [
					{ 
						$or: [
							{ 'simpleName': { $regex: '\\b('+params.placeName+')\\b', $options: 'i' } },
							{ 'placeName': { $regex: '\\b('+params.placeName+')\\b', $options: 'i' } },
							{ 'aliases': { $in: [new RegExp(`\\b(${params.placeName})\\b`, 'i')] } },
						]
					},
					{
						$or: [
							{ 'placeItems.simpleName': { $regex: '\\b('+params.itemName+')\\b', $options: 'i' } },
							{ 'placeItems.aliases': { $in: [new RegExp(`\\b(${params.itemName})\\b`, 'i')] } },
							{ 'items.name': { $regex: '\\b('+params.itemName+')\\b', $options: 'i' } },
							{ 'items.aliases': { $in: [new RegExp(`\\b(${params.itemName})\\b`, 'i')] } },
						],
					},
				] : [
					{ 'simpleName': { $regex: '\\b('+params?.placeName+')\\b', $options: 'i' } },
					{ 'placeName': { $regex: '\\b('+params?.placeName+')\\b', $options: 'i' } },
					{ 'aliases': { $in: [new RegExp(`\\b(${params?.placeName})\\b`, 'i')] } },
				],
			},
		});

		// query.push({
		// 	$match: {
		// 		$or: [
		// 			{ placeName: { $regex: params?.placeName, $options: 'i' } },
		// 			!!params?.itemName ? {
		// 				$or: [
		// 					{ 'placeItems.name': { $regex: params.itemName, $options: 'i' } },
		// 					{ 'placeItems.aliases': { $in: [new RegExp(`${params.itemName}`, 'i')] } },
		// 					{ 'items.name': { $regex: params.itemName, $options: 'i' } },
		// 					{ 'items.aliases': { $in: [new RegExp(`${params.itemName}`, 'i')] } },
		// 				],
		// 			} : {},
		// 		],
		// 	},
		// });

		query.push(
			{
				$set: {
					'items.placeItem': '$placeItems',
				},
			},
			{
				$unset: 'openingTimes._id',
			},
			{
				$unwind: {
					path: '$items',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$lookup: {
					from: 'place_item_ratings',
					localField: '_id',
					foreignField: 'place',
					pipeline: [
						{
							$match: {
								$expr: {
									$ne: ['$placeItem', null],
								},
							},
						},
					],
					as: 'ratingInfo',
				},
			},
			{
				$unwind: {
					path: '$ratingInfo',
					preserveNullAndEmptyArrays: true,
				},
			},
			{ $set: { fieldType1: { $type: '$placeItems.ratingInfo' }, fieldType2: { $type: '$ratingInfo' } } },


			{
				$group: {
					_id: '$_id',
					placeName: {
						$first: '$placeName',
					},
					address: {
						$first: '$address',
					},
					tags: {
						$first: '$tags',
					},
					openingTimes: {
						$first: '$openingTimes',
					},
					medias: {
						$first: '$medias',
					},
					createdAt: {
						$first: '$createdAt',
					},
					modifiedAt: {
						$first: '$modifiedAt',
					},
					items: {
						$addToSet: '$items',
					},
					ratingInfo: {
						$first: '$ratingInfo',
					},
					fieldType1: {
						$first: '$fieldType1',
					},
					fieldType2: {
						$first: '$fieldType2',
					},
				},
			},
			{
				$sort: {
					fieldType2: -1 as const, fieldType1: -1 as const,
					'places.placeItems.ratingInfo.taste': -1 as const,
					'places.ratingInfo.service': -1 as const,
				},
			},
			{ $project: { 'fieldType2': 0, fieldType1: 0 } },
		);
		log.trace('In getPlaces, query:: ', JSON.stringify(	query));
		let places;
		try {

			places = await Place.aggregate([...query]);
			/*if (!!params?.placeName && !!params?.postcode) {

				places = await Place.aggregate([{
						$lookup: {
							from: PlaceItem.collection.collectionName,
							localField: '_id', // field of reference to PlaceItem
							foreignField: 'place',
							as: 'placeItems',
						},
					},
						{
							$match:
								{
									$and: [
										{ 'address.postcode': +params?.postcode },
										{
											$or: [
												{ placeName: { $regex: params?.placeName, $options: 'i' } },
												{
													$or: [
														{ 'placeItems.name': { $regex: params.itemName, $options: 'i' } },
														{ 'placeItems.aliases': { $in: [new RegExp(`${params.itemName}`, 'i')] } },
													],
												},
											],
										},
									],
								},
						},
					],
				)
					.skip(prams.pageSize * (prams.pageNumber - 1))
					.limit(prams.pageSize)
					// .lean()
					.exec();
			} else {
				places = await Place.find({})
					.populate({
						path: 'placeItems',
						match: {
							$or: [
								{ name: { $regex: params?.itemName, $options: 'i' } },
								{ aliases: { $in: params?.itemName, $options: 'i' } },
							],
						},
						populate: {
							path: 'rating',
						},
						options: { sort: { 'rating.taste': -1 }, perDocumentLimit: 5 },
					})
					.populate('address')
					.skip(prams.pageSize * (prams.pageNumber - 1))
					.limit(prams.pageSize)
					.lean()
					.exec();
			}*/

		} catch (error) {
			log.error('Error while doing getPlaces', error);
			throw error;
		}
		log.trace('Returning fetched places::', places);
		return places;
	}

	//get a single place
	async getPlaceByNameAndGeoLocation(args: {
		name: string | undefined,
		latitude?: string,
		longitude?: string
	}): Promise<IPlace | undefined> {

		if (!args.name || !args.latitude || !args.longitude) return undefined;
		log.debug('Received request to get a place with args: ', args);

		const places: any[] = await Place.aggregate([
			{
				$match: {
					'placeName': { $regex: args.name, $options: 'i' },
					"address.location.longitude": { $regex: args.longitude.substring(0, args.longitude.indexOf('.') + 4), $options: 'i' },
					"address.location.latitude": { $regex: args.latitude.substring(0, args.latitude.indexOf('.') + 4), $options: 'i' },
				}
			}
		]);

		if(places?.length){ 
			return places[0];
		}
		return undefined;
	}

	//get a single place
	async getPlace(args: {
		id: string | undefined,
		fetchMenu?: boolean,
		fetchReviews?: boolean,
		size?: number,
		page?: number
	} = {
		id: undefined,
		fetchMenu: true,
		fetchReviews: false,
		size: config.PAGE_SIZE,
		page: 1,
	}): Promise<IPlace | undefined> {
		if (!args.id) return undefined;
		log.debug('Received request to get a place with args: ', args);
		args.size = args.size ?? config.PAGE_SIZE;
		args.page = args.page ?? 1;
		try {
			// const place = await Place.findById({ _id: args.id })
			// 	.populate({ path: 'reviews ratings', options: { sort: { createdAt: -1 }, perDocumentLimit: 5 } })
			// 	.populate({
			// 		path: 'placeItems',
			// 		// populate: { path: 'medias reviews ratings', options: { sort: { createdAt: -1 }, perDocumentLimit: 5 } },
			// 	})
			// 	.lean();

			let query: any[] = [];
			if (args.fetchMenu) {
				query = [
					{
						$lookup: {
							from: 'place_items',
							localField: '_id',
							foreignField: 'place',
							pipeline: [
								{
									$lookup: {
										from: 'place_item_ratings',
										localField: '_id',
										foreignField: 'placeItem',
										as: 'ratingInfo',
									},
								},
								{
									$unwind: {
										path: '$ratingInfo',
										preserveNullAndEmptyArrays: true,
									},
								},
								{
									$lookup: {
										from: 'reviews',
										localField: '_id',
										foreignField: 'placeItem',
										pipeline: [
											{
												$lookup: {
													from: 'customers',
													localField: 'customer',
													foreignField: '_id',
													pipeline: [{ $project: { name: 1, status: 1 } }],
													as: 'customer',
												},
											},
											{ $unwind: '$customer' },
											{ $match: { $expr: { $ne: ['$description', null] } } },
											{ $sort: { createdAt: -1 } },
											{ $limit: 3 },
											{ $project: { customer: 1, description: 1, taste: 1, presentation: 1 } },
										],
										as: 'reviews',
									},
								},
								{
									$set:{
										media: {$first: '$media'}
									}
								}
							],
							as: 'placeItem',
						},
					},

					{
						$unwind: {
							path: '$placeItem',
							preserveNullAndEmptyArrays: true,
						},
					},
					{
						$lookup: {
							from: 'items',
							localField: 'placeItem.item',
							foreignField: '_id',
							pipeline: [
								{
									$project: {
										createdAt: 0,
										modifiedAt: 0,
									},
								},
							],
							as: 'items',
						},
					},
					{
						$set: {
							items: {
								$map: {
									input: '$items',
									in: {
										$mergeObjects: [
											'$$this',
											{ placeItem: '$placeItem' },
										],
									},
								},
							},
						},
					},
					{
						$unset: ['placeItem'],
					},
					{$group: {
						_id: "$_id",
						placeName: {$first: "$placeName"},
						simpleName: {$first: "$simpleName"},
						address: {$first: "$address"},
						tags: {$first: "$tags"},
						openingTimes: {$first: "$openingTimes"},
						medias: {$first: "$medias"},
						items: {
						$push: {
							$arrayElemAt: [ "$items", 0 ] ,
							}   
						}
					}}
				];
			} else if (args.fetchReviews) {
				query = [
					{
						$lookup:
							{
								from: 'reviews',
								localField: '_id',
								foreignField: 'place',
								pipeline: [
									{
										$match: {
											$expr: {
												$and: [
													
													{ $or: [
														{$ne: ['$description', null]},
														{$ne: ['$service', null]},
														{$ne: ['$ambience', null]},
														
														{$ne: ['$medias', null]},
													] },
													{ $eq: ['$placeItem', null] },
												],
											},
										},
									},

									{ $sort: { createdAt: -1 } },
									{ $limit: +args.size },
									{ $skip: (+args.page! - 1) * +args.size! },
									{
										$lookup: {
											from: "reviewthreads",
											localField: "_id",
											foreignField: "review",
											pipeline:[{
												$project: {
													// createdAt: 0,
													replies: 1,
													likedBy: {
														_id: 1
													},
													review: 1,
													// modifiedAt: 0,
													// __v: 0,
													_id: 1,
													customer: 1,
													dislikedBy: 1


												}
											}],
											as: "info"
										}
									},
									{
										$unwind: {
											path: "$info",
											preserveNullAndEmptyArrays: true
										}
									},
									{
										$lookup: {
											from: 'reviews',
											localField: 'children',
											foreignField: '_id',
											pipeline: [
												{
													$lookup: {
														from: 'place_items',
														localField: 'placeItem',
														foreignField: '_id',
														pipeline: [
															{
																$project: {
																	name: 1,
																	item: 1,
																},
															},
														],
														as: 'placeItem',
													},
												},
												{
													$unwind: {
														path: '$placeItem',
														preserveNullAndEmptyArrays: true,
													},
												},
											],
											as: 'children',
										},
									},
									{
										$lookup: {
											from: 'customers',
											localField: 'customer',
											foreignField: '_id',
											pipeline: [
												{
													$project: {
														name: 1,
														status: 1,
													},
												},
											],
											as: 'customer',
										},
									}, {
										$unwind: {
											path: '$customer',
											preserveNullAndEmptyArrays: true,
										},
									},
								],
								as: 'reviews',

							},
					},

					{
						$lookup: {
							from: 'reviews',
							localField: '_id',
							foreignField: 'place',
							pipeline: [
								{
									$match: {
										$expr: {
											$eq: ['$placeItem', null],
										},
									},
								},
								{
									$unwind: {
										path: '$medias',
										preserveNullAndEmptyArrays: true,
									},
								},
								{
									$group: {
										_id: null,
										medias: {
											$push: '$medias',
										},
									},
								},
								{
									$unwind: {
										path: '$medias',
										preserveNullAndEmptyArrays: true,
									},
								},
								{
									$project: {
										_id: 0,
										media: {$first: '$medias'},
									},
								},
							],
							as: 'reviewMedias',
						},
					},
				];
			}
			const placeDetail: any = await Place.aggregate([
				{
					$match: {
						$expr: {
							$eq: [{ $toObjectId: args.id }, '$_id'],
						},
					},
				},
				{ $unset: 'openingTimes._id' },
				{
					$lookup: {
						from: 'place_item_ratings',
						localField: '_id',
						foreignField: 'place',
						pipeline: [
							{
								$match: { $expr: { $eq: ['$placeItem', null] } },
							},
							{
								$project: { _id: 0 },
							},
						],
						as: 'ratingInfo',
					},
				},
				{
					$unwind: {
						path: '$ratingInfo',
						preserveNullAndEmptyArrays: true,
					},
				},
				...query,
			]);
			log.trace('Place detail found: ', placeDetail);
			if (!placeDetail?.length) {
				log.trace('Place not found for id: ', args.id);
				throw new HTTP404Error('Place not found with given id: ' + args.id);
			}
			log.trace('Fetched a Place id: ' + args.id + '. place: ', placeDetail);
			return placeDetail[0];
		} catch (error) {
			log.error('Error while doing getPlace with id: ' + args.id + '. Error: ', error);
			throw error;
		}
	}

	async getAnItemInAPlace(params: {
		placeId?: string;
		itemId?: string,
		placeItemId?: string,
		page?: number,
		size?: number
	}): Promise<PlaceModel[] | undefined> {
		log.debug('item.service -> getAPlaceItem2, received request to get an item with params: ', params);
		try {
			let prematch: any;
			if (!!params.placeItemId) {
				prematch =
					[{
						$lookup: {
							from: 'place_items',
							localField: '_id',
							foreignField: 'place',
							pipeline: [
								{
									$match: {
										$expr: {
											$eq: [{ $toObjectId: params.placeItemId }, '$_id'],
										},
									},
								},
								{
									$lookup: {
										from: 'place_item_ratings',
										localField: '_id',
										foreignField: 'placeItem',
										as: 'ratingInfo',
									},
								},
								{
									$unwind: {
										path: '$ratingInfo',
										preserveNullAndEmptyArrays: true,
									},
								},
								{
									$lookup: {
										from: 'reviews',
										localField: '_id',
										foreignField: 'placeItem',
										pipeline: [
											{
												$match: {
													$expr: {
														$ne: [null, '$description'],
													},
												},
											},
											{ $sort: { createdAt: -1 } },
											{ $skip: ((params.page ?? 1) - 1) * (params.size ?? 5) },
											{ $limit: (params.size ?? 5) },
											{
												$lookup: {
													from: Customer.collection.collectionName,
													localField: 'customer', // field of reference to Place schema
													foreignField: '_id',
													pipeline: [
														{
															$project: {
																createdAt: 0,
																modifiedAt: 0,
															},
														},
													],
													as: 'customer',
												},
											},
											{
												$unwind: {
													path: '$customer',
													preserveNullAndEmptyArrays: true,
												},
											},
											// {
											// 	$lookup: {
											// 		from: ReviewThread.collection.collectionName,
											// 		localField: '_id', // field of reference to Place schema
											// 		foreignField: 'review',
											// 		pipeline:[
											// 			{
											// 				$project: {
											// 					createdAt: 0,
											// 					modifiedAt: 0,
											// 				},
											// 			},
											// 		],
											// 		as: 'info',
											// 	},
											// },
											// {
											// 	$unwind: {
											// 		path: '$info',
											// 		preserveNullAndEmptyArrays: true,
											// 	},
											// },
										],
										as: 'reviews',
									},
								},
							],
							as: 'placeItem',
						},
					},
						{
							$unwind: {
								path: '$placeItem',
								preserveNullAndEmptyArrays: true,
							},
						},
					];
			} else if (params.placeId && params.itemId) {
				prematch = [{
					$match: {
						$expr: {
							$eq: [{ $toObjectId: params.placeId }, '$_id'],
						},
					},
				},
					{
						$lookup: {
							from: 'place_items',
							localField: '_id',
							foreignField: 'place',
							pipeline: [
								{
									$match: {
										$expr: {
											$eq: [{ $toObjectId: params.itemId }, '$item'],
										},
									},
								},
								{
									$lookup: {
										from: 'place_item_ratings',
										localField: '_id',
										foreignField: 'placeItem',
										as: 'ratingInfo',
									},
								},
								{
									$unwind: {
										path: '$ratingInfo',
										preserveNullAndEmptyArrays: true,
									},
								},
								{
									$lookup: {
										from: 'reviews',
										localField: '_id',
										foreignField: 'placeItem',
										pipeline: [
											{
												$match: {
													$or: [
														{ description: { $ne: null } },
														{ medias: { $exists: true, $ne: []} }
													]
												}
											},
											{ $sort: { createdAt: -1 } },
											{ $skip: ((params.page ?? 1) - 1) * (params.size ?? 5) },
											{ $limit: (params.size ?? 5) },
											{
												$lookup: {
													from: Customer.collection.collectionName,
													localField: 'customer', // field of reference to Place schema
													foreignField: '_id',
													pipeline: [
														{
															$project: {
																createdAt: 0,
																modifiedAt: 0,
															},
														},
													],
													as: 'customer',
												},
											},
											{
												$unwind: {
													path: '$customer',
													preserveNullAndEmptyArrays: true,
												},
											},
											// {
											// 	$lookup: {
											// 		from: ReviewThread.collection.collectionName,
											// 		localField: '_id', // field of reference to Place schema
											// 		foreignField: 'review',
											// 		pipeline:[
											// 			{
											// 				$project: {
											// 					createdAt: 0,
											// 					modifiedAt: 0,
											// 				},
											// 			},
											// 		],
											// 		as: 'info',
											// 	},
											// },
											// {
											// 	$unwind: {
											// 		path: '$info',
											// 		preserveNullAndEmptyArrays: true,
											// 	},
											// },
										],
										as: 'reviews',
									},
								},
								{
									$lookup: {
										from: 'reviews',
										localField: '_id',
										foreignField: 'placeItem',
										pipeline: [
											{
												$unwind: {
													path: '$medias',
													preserveNullAndEmptyArrays: false,
												},
											},
											{
												$group: {
													_id: null,
													medias: {
														$push: '$medias',
													},
												},
											},
											{
												$unwind: {
													path: '$medias',
													preserveNullAndEmptyArrays: false,
												},
											},
											{
												$project: {
													_id: 0,
													media: '$medias',
												},
											},
										],
										as: 'reviewMedias',
									},
								},
								{
									$set: {
										media: {$first: '$media'}
									}
								}

							],
							as: 'placeItem',
						},
					},
					{
						$unwind: {
							path: '$placeItem',
							preserveNullAndEmptyArrays: true,
						},
					},
				];
			}

			// $expr: {
			// 	$eq: [{ $toObjectId: args.itemId }, '$item'],
			// },
			const places: PlaceModel[] = await Place.aggregate([
				...prematch,
				{
					$lookup: {
						from: 'items',
						localField: 'placeItem.item',
						foreignField: '_id',
						as: 'items',
					},
				},
				{
					$addFields: {
						name: '$placeName',
						items: {
							$map: {
								input: '$items',
								in: {
									$mergeObjects: [
										'$$this',
										{
											placeItem: '$placeItem',
										},
									],
								},
							},
						},
					},
				},
				{
					$project: {
						placeItem: 0,
					},
				},
			]);
			if (!places) {
				log.trace('Item not found for params: ', params);
				return undefined;
			}
			log.trace('Fetched an item from place with given params: ' + params + '. places: ', places);
			return places;
		} catch (error) {
			log.error('Error while doing getAnItemInAPlace with params: ' + params + '. Error: ', error);
			throw error;
		}
	}


	//update a place
	async updatePlaceMedias(id: string, media: IMedia): Promise<IPlace | null | undefined> {
		log.debug('Received request to add a media a place with id: ', id);

		try {
			//pass the id of the object you want to update
			//data is for the new body you are updating the old one with
			//new:true, so the dats being returned, is the update one
			log.trace('Updating a place id: ' + id + ' with media: ', media);
			const placez: any = await Place.findByIdAndUpdate(
				{ _id: id },
				{ $push: { medias: { $each: [media], $sort: -1, $slice: 5 } } },
				{
					new: true,
				},
			);
			log.debug('Successfully updated the Place: ', placez);
			return placez;
		} catch (error) {
			log.error('Error while updating Place with id: ' + id + '. Error: ', error);
			throw error;
		}
	}

	async updatePlace(id: number, data: any): Promise<IPlace | null | undefined> {
		log.debug('Received request to update a place with id: ', id);

		try {
			//pass the id of the object you want to update
			//data is for the new body you are updating the old one with
			//new:true, so the dats being returned, is the update one
			log.trace('Updating a place id: ' + id + ' with data: ', data);
			const placez = await Place.findByIdAndUpdate({ _id: id }, data, {
				new: true,
			});
			log.debug('Successfully updated the Place: ', placez);
			return placez;
		} catch (error) {
			log.error('Error while updating Place with id: ' + id + '. Error: ', error);
		}
	}

	//delete a place by using the find by id and delete
	async deletePlace(id: string): Promise<IPlace | undefined> {
		log.debug('Received request to delete a place with id: ', id);

		try {
			const place = await Place.findByIdAndDelete(id);
			if (!place) {
				log.trace('Delete failed, Place with id: ' + id + ' not found');
				return undefined;
			}
			log.trace('Place with id: ' + id + ' deleted successfully');
			return place;
		} catch (error) {
			log.error('Error while deleting Place with id: ' + id + '. Error: ', error);
		}
	}

		//delete a place by using the find by id and delete
	async doCorrectPlaceRecords(): Promise<any | undefined> {
		log.debug('Received request to delete all duplicate places');

		try {
			const placesWithDuplicates: any[] = await Place.aggregate([
				{
				  "$group": {
					"_id": "$placeName",
					"original": { "$first": "$$ROOT" },
					"duplicates": { "$push": "$$ROOT" },
					"count": { "$sum": 1 }
				  }
				},
				{
				  "$match": {
					"count": { "$gt": 1 }
				  }
				},
				{
				  "$project": {
					"placeName": "$placeName",
					"original": 1,
					"duplicates": {
					  "$filter": {
						"input": "$duplicates",
						"as": "place",
						"cond": { "$ne": ["$$place._id", "$original._id"] }
					  }
					}
				  }
				}
			  ]);
			const allDuplicateIds: any[] = [];
			placesWithDuplicates.forEach(p => p.duplicates.forEach((d: any) => allDuplicateIds.push(d._id)));
			
			log.trace('Duplicate ids to be deleted:: ',allDuplicateIds);
			let result = Place.deleteMany({ _id: { $in: allDuplicateIds }});

			const suburbs = await suburbService.getSuburbNames({city: 'Sydney'});
			const suburbNames = suburbs?.map(sub => sub.name);

			const placesWithTheirSuburbName = await Place.aggregate([
				{
				  $addFields: {
					suburbInPlaceName: {
					  $regexMatch: {
						input: "$placeName",
						regex: {
						  $toString: "$address.suburb"
						},
						options: "i"
					  }
					}
				  }
				},
				{
				  $match: {
					suburbInPlaceName: true
				  }
				},
				{
				  $project: {
					suburbInPlaceName: 0
				  }
				}
			  ]);
			for(const pl of placesWithTheirSuburbName) {
				pl.placeName=pl.placeName.replace(pl.address.suburb,'');
				pl.placeName=pl.placeName.replace('()','');
				pl.placeName=pl.placeName.replace('  ',' ');
				pl.placeName=pl.placeName.replace(/(- |-)$/,'').trim();
				pl.simpleName = cleanPlaceName(pl.placeName, suburbNames ?? [pl.address?.suburb]);
				await Place.findByIdAndUpdate(pl._id, pl);
			};

			return result;
		} catch (error) {
			log.error('Error while deleting duplicate Places. Error: ', error);
		}
	}
}

//export the class
export const placeService: PlaceService = new PlaceService();
