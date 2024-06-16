import { IReview, Review } from '../entities/review';
import { Logger } from 'log4js';
import { dateXMonthsBack, getLogger } from '../utils/Utils';
import { IPlace, Place } from '../entities/place';
import { IPlaceItemRating, PlaceItemRating } from '../entities/placeItemRating';
import { placeService } from './place.service';
import { FilterQuery, InsertManyResult, ObjectId } from 'mongoose';

const log: Logger = getLogger('review.service');

export class ReviewService {
	//add a review
	async addReview(data: IReview): Promise<IReview> {
		log.trace('Request received in addReview, data: ', data);
		try {
			data.createdAt = new Date();
			data.modifiedAt = new Date();
			const newReview = await Review.create(data);
			log.debug('Review added successfully returning created object. newReview: ', newReview);
			return newReview;
		} catch (error) {
			log.error('Error while adding a review. Error: ', error);
			throw error;
		}
	}

	//add bulk review
	async addBulkReviews(reviews: IReview[]): Promise<IReview[]> {
		log.trace('Request received in addReview, data: ', reviews);
		reviews?.forEach(r => {
			r.createdAt = new Date();
			r.modifiedAt = new Date();
		})
		try {
			// data.createdAt = new Date();
			// data.modifiedAt = new Date();
			const newReview = await Review.insertMany(reviews);
			log.debug('Review added successfully returning created object. newReview: ', newReview);
			return newReview;
		} catch (error) {
			log.error('Error while adding a review. Error: ', error);
			throw error;
		}
	}

	//get all reviews
	async getReviews(params: { placeId: number; itemId?: number; pageNumber: number; pageSize: number } ): Promise<IReview[] | undefined> {
		log.debug('Received request to getReviews, params:: ', params);
		try {
			const reviews = await this.getReviewsOfPlaceAndItem(params);
			log.trace('Returning fetched reviews');
			return reviews;
		} catch (error) {
			log.error('Error while doing getReviews', error);
		}
	}

	//get a single review
	async getReview(query: { id?: number; correlationId?: string }): Promise<IReview | null> {
		if (!query.id && !query.correlationId) {
			log.error('Need either id or correlationId to query a Review document');
			throw new Error('Need either id or correlationId to query a Review document');
		}
		try {
			let review: IReview | null;
			if (query.id) {
				review = await Review.findById(query.id).populate('children customer info');
			} else {
				review = await Review.findOne({ correlationId: query.correlationId });
			}
			log.trace('Found review with query', query);
			return review;
		} catch (error) {
			log.error('Error while fetching Review with id: ' + query.id + ', correlationId: ' + query.correlationId, error);
			throw error;
		}
	}

	/**
	 * Get paginated reviews of a place
	 * @param query
	 */
	async getReviewsOfPlaceAndItem(query: {
		placeId?: number,
		itemId?: number,
		pageSize?: number,
		pageNumber?: number
	}): Promise<IReview[] | undefined> {
		if (!query.placeId) {
			log.error('Need either placeId to query a Review document');
			throw new Error('Need either placeId to query a Review document');
		}
		const params: { pageSize: number, pageNumber: number } = {
			...query,
			pageNumber: query?.pageNumber ?? 1,
			pageSize: query?.pageSize ?? 7,
		};

		try {
			let review: IReview[] | null;
			if (!!query.placeId && !!query.itemId) {
				review = await Review.find({ place: { _id: query.placeId }, item: { _id: query.itemId } })
					.skip(params.pageSize * (params.pageNumber - 1)).limit(params.pageSize).lean().exec();
			} else {
				review = await Review.find({ place: { _id: query.placeId } })
					.skip(params.pageSize * (params.pageNumber - 1)).limit(params.pageSize).lean().exec();
			}
			log.trace('Found review', review);
			return review ?? undefined;
		} catch (error) {
			log.error('Error while fetching Review with placeId: ' + query.placeId + ', optional itemId: ' + query.itemId, error);
			throw error;
		}
	}

	//update a review
	async updateRating(query: { place: number, item?: number }): Promise<void> {
		log.debug('Received request to update a Rating with placeId: %s, itemId: %s', query.place, query.item);
		try {

			const filter: FilterQuery<any> = !!query.item ? { place: { _id: query.place }, item: { _id: query.item } } : { place: { _id: query.place }, item: null};
			log.trace('Find if an entry with that place/item exists in PlaceItemRating with filter: ',filter);
			let rating: IPlaceItemRating|null = await PlaceItemRating.findOne(filter, null, 	{
				lean: true
			});
			if (rating) {
				log.trace('Found a rating entry to update, id: ', rating._id);
			}
			log.debug('Calculate all the 4 ratings in the last 3 months for the place and place&item pairs');

			const avgRatings = await Review.aggregate([
					{
						$match: {
							place: query.place,
							item: query.item,
							$expr: {
								$gte: [
									'$createdAt',
									dateXMonthsBack(2)],
							},
						},
					},
					{
						$group:
							{
								_id: null,
								avgTaste: { $avg: '$taste'},
								avgPresentation: { $avg: '$presentation' },
								avgService: { $avg: '$service' },
								avgAmbience: { $avg: '$ambience' },
								noOfReviews: { $sum: 1 },
								place: { $first: '$place'},
								item: { $first: '$item'}
							},
					},
				],
			);
			await Review.populate(avgRatings, [{ path: "place" }, { path: 'item' }]);
			log.trace('In review.service, updateRating(), calculated rating for last 3 months: ', avgRatings);
			log.debug('Updating PlaceItemRating table with ratings, ', rating?._id);

			rating = {
				...rating,
				place: avgRatings[0].place,
				item: avgRatings[0].item,
				noOfReviews: avgRatings[0].noOfReviews,
				taste: query.item?avgRatings[0].avgTaste:null,
				presentation: query.item?avgRatings[0].avgPresentation:null,
				service:avgRatings[0].avgService,
				ambience: avgRatings[0].avgAmbience,
				createdAt: new Date(),
				modifiedAt: new Date()
			} as IPlaceItemRating;

			log.debug('Updating PlaceItemRating table with ratings, ', rating?._id);
			if(!!rating._id) {
				await PlaceItemRating.findByIdAndUpdate(rating._id, rating, { upsert: true });
			} else {
				await PlaceItemRating.create(rating);
			}
		} catch (error) {
			log.error('Error while updating Review with placeId: %s, itemId: %s', query.place, query.item, error);
		}
	}

	//update a review
	async updateReview(id: number, data: any, populate?: string): Promise<IReview | undefined> {
		log.debug('Received request to update a Review with id: ', id);
		try {
			//pass the id of the object you want to update
			//data is for the new body you are updating the old one with
			//new:true, so the dats being returned, is the update one
			log.trace('Updating a Review id: ' + id + ' with data: ', data);
			let reviewz = await Review.findByIdAndUpdate(id, data, {
				new: true,
			});
			log.trace('In review.service->updateReview(), result: ', reviewz);
			await Review.populate(reviewz, { path: 'info'+' '+ populate });
			log.trace('In review.service->updateReview(), populated info', reviewz);

			return reviewz ?? undefined;
		} catch (error) {
			log.error('Error while updating Review with id: ' + id + '. Error: ', error);
		}
	}

	//delete a review by using the find by id and delete
	async deleteReview(id: string): Promise<IPlace | undefined> {
		log.debug('Received request to delete a place with id: ', id);
		try {
			const review = await Review.findByIdAndDelete(id);
			if (!review) {
				log.trace('Delete failed, Review with id: ' + id + ' not found');
				return undefined;
			}
		} catch (error) {
			log.error('Error while deleting Review with id: ' + id + '. Error: ', error);
		}
	}
}

//export the class
export const reviewService = new ReviewService();
