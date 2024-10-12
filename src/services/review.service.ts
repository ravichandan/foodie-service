import { IReview, Review } from '../entities/review';
import { Logger } from 'log4js';
import { dateXMonthsBack, getLogger } from '../utils/Utils';
import { IPlace, Place } from '../entities/place';
import { IPlaceItemRating, PlaceItemRating } from '../entities/placeItemRating';
import { placeService } from './place.service';
import { FilterQuery, InsertManyResult, ObjectId } from 'mongoose';
import { PlaceItem } from '../entities/placeItem';
import { ReviewThread } from '../entities/reviewThread';

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
    reviews?.forEach((r) => {
      r.createdAt = new Date();
      r.modifiedAt = new Date();
    });
    try {
      // data.createdAt = new Date();
      // data.modifiedAt = new Date();
      const newReview = await Review.insertMany(reviews);
      log.debug('Review added successfully returning created object. newReview: ', newReview);
      return newReview;
    } catch (error) {
      log.error('Error while adding bulk reviews. Error: ', error);
      throw error;
    }
  }

  //get all reviews
  async getReviews(params: {
    placeId: number;
    itemId?: number;
    pageNumber: number;
    pageSize: number;
  }): Promise<IReview[] | undefined> {
    log.debug('Received request to getReviews, params:: ', params);
    try {
      const reviews = await this.getReviewsOfPlaceAndItem(params);
      log.trace('Returning fetched reviews');
      return reviews;
    } catch (error) {
      log.error('Error while doing getReviews', error);
    }
  }

  //get all reviews
  async getReviewMedias(params: {
    placeId: string;
    itemId: string;
    pageNumber: number;
    pageSize: number;
  }): Promise<IReview[] | undefined> {
    if(!params.placeId || !params.itemId) return;
    params.pageNumber=params.pageNumber? +params.pageNumber : 1;
    params.pageSize=params.pageSize? +params.pageSize : 30;
    log.debug('Received request to getReviewMedias, params:: ', params);
    try {
      const reviews = Review.aggregate([
        {
          $lookup: {
              from: "place_items",
              localField: "placeItem",
              foreignField: "_id",
              as: "pi",
              pipeline: [{
                $match:{
                  $expr:{
                    $and:[
                      {$eq: [{ $toObjectId: params.placeId }, '$place']},
                      {$eq: [{ $toObjectId: params.itemId }, '$item']}
                    ]
                  }
                  
                }
              }]
            }
        },
        {
          $unwind: {
              path: "$pi",
              preserveNullAndEmptyArrays: false
            }
        },
        {
          $match: {
            $expr: {
              $eq: ["$placeItem", "$pi._id"]
            }
          }
        },
        {
          $unwind: {
            path: "$medias",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unset: ["children", "pi", "parent", "place"]
        },
        {
          $lookup: {
              from: "customers",
              localField: "customer",
              foreignField: "_id",
              as: "customer",
              pipeline: [{ $unset: ["reviews"] }]
            }
        },
        {
          $unwind: {
              path: "$customer",
              preserveNullAndEmptyArrays: true
            }
        },
        { $sort: { createdAt: -1 } },
        { $skip: ((params.pageNumber ?? 1) - 1) * (params.pageSize ?? 30) },
        { $limit: (params.pageSize ?? 30) },
      ])
      log.trace('Returning fetched reviews with reviewMedias');
      return reviews;
    } catch (error) {
      log.error('Error while doing getReviewMedias', error);
    }
  }

  //get a single review
  async getReview(query: { id?: string; correlationId?: string }): Promise<IReview | null> {
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
    placeId?: number;
    itemId?: number;
    pageSize?: number;
    pageNumber?: number;
  }): Promise<IReview[] | undefined> {
    if (!query.placeId) {
      log.error('Need either placeId to query a Review document');
      throw new Error('Need either placeId to query a Review document');
    }
    const params: { pageSize: number; pageNumber: number } = {
      ...query,
      pageNumber: query?.pageNumber ?? 1,
      pageSize: query?.pageSize ?? 7,
    };

    try {
      let review: IReview[] | null;
      if (!!query.placeId && !!query.itemId) {
        review = await Review.find({ place: { _id: query.placeId }, placeItem: { _id: query.itemId } })
          .skip(params.pageSize * (params.pageNumber - 1))
          .limit(params.pageSize)
          .lean()
          .exec();
      } else {
        review = await Review.find({ place: { _id: query.placeId } })
          .skip(params.pageSize * (params.pageNumber - 1))
          .limit(params.pageSize)
          .lean()
          .exec();
      }
      log.trace('Found review', review);
      return review ?? undefined;
    } catch (error) {
      log.error(
        'Error while fetching Review with placeId: ' + query.placeId + ', optional itemId: ' + query.itemId,
        error,
      );
      throw error;
    }
  }

  //update a review
  async updateRating(query: { place: ObjectId; item?: ObjectId; placeItem?: ObjectId }): Promise<void> {
    log.debug('Received request to update a Rating with placeId: %s, itemId: %s', query.place, query.item);

    // const temp = await Review.aggregate([
    //   {
    //     $match: {
    //       item: null,
    //       placeItem: null,
    //       $expr:
    //           { $eq: [null, '$item'], },
    //           { $eq: [null, '$placeItem'], },
              // { $eq: [{ $toObjectId: query.place.toString() }, '$place'], },
          // },
        // },
      // },
      // {
      //   $match: {
      //     $expr: {
      //       $and:[{
      //         $eq: [{ $toObjectId: '6681190cfba0035e4672b98a' }, '$place'],
      //       },{
      //         $eq: [{ $toObjectId: '668a7fd5ed97f7a5de5f5692' }, '$item'],
      //       }]
      //     },
      //     // place: "6681190cfba0035e4672b98a",
      //     // item: "668a7fd5ed97f7a5de5f5690",
      //   }
      // },
      // {
      //   $lookup: {
      //     from: 'place_items',
      //     localField: 'place',
      //     foreignField: 'place',
      //     pipeline: [
      //       {
      //         $match: {
      //           $expr: {
      //             $eq: [{ $toObjectId: '668a7fd5ed97f7a5de5f5690' }, '$item']
      //           }
      //         },
      //       },
      //       {
      //         $project: {
      //           _id: '$_id',
      //         },
      //       },
      //     ],
      //     as: 'placeItem',
      //   },
      // },
      // {
      //   $unwind: {
      //     path: '$placeItem',
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
    // ]);
    //
    // log.trace('in temp result:: ', temp?.length);
    try {
      log.debug('Calculate all the 4 ratings in the last 3 months for the place and place&item pairs');
      log.debug('dateXMonthsBack(2):: ', JSON.stringify(dateXMonthsBack(2)));

      let matchQry;
      if(query.placeItem) {
        matchQry = [{
          $match: {
            $expr: {
              $and:[
                { $gte: ['$createdAt', dateXMonthsBack(2)] },
                { $eq: [{ $toObjectId: query.placeItem.toString() }, '$placeItem'], }
               ]
            },
          },
        }]
      } else {
        // await ReviewThread.findOne({ review: new mongoose.Types.ObjectId(reviewId) });
        if(query.item) {
          const placeItem = await PlaceItem.findOne({place: query.place, item: query.item}, '_id', { lean: true});
          if(!placeItem) {log.error('PlaceItem not found for given place and item'); throw new Error('PlaceItem not found for given place and item')}
          matchQry = [{
            $match: {
              $expr: {
                $and:[
                  { $gte: ['$createdAt', dateXMonthsBack(2)] },
                  { $eq: [{ $toObjectId: placeItem._id.toString() }, '$placeItem'], }
                  // { $gte: ['$createdAt', dateXMonthsBack(2)] },
                  // { $eq: [{ $toObjectId: query.item }, '$item'], },
                  // { $eq: [{ $toObjectId: query.place }, '$place'], },
                ]
              },
            },
          },
          /*  {
              $lookup: {
                from: 'place_items',
                localField: 'place',
                foreignField: 'place',
                pipeline: [
                  {
                    $match: { $expr: { $eq: [{ $toObjectId: query.item.toString }, '$item'], }, },
                  },
                  {
                    $project: {
                      _id: '$_id',
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
            }*/
          ];
        } else{
          matchQry = [{
            $match: {
              placeItem: null,
              item: null,
              $expr: {
                $and:[
                  { $gte: ['$createdAt', dateXMonthsBack(2)] },
                  { $eq: [{ $toObjectId: query.place.toString() }, '$place'] }
                ] }
              // },
            },
          }];
        }
      }
      const avgRatings = await Review.aggregate([
          ...matchQry,
          {
          $group: {
            _id: {place: '$place',placeItem: '$placeItem._id'},
            avgTaste: { $avg: '$taste' },
            avgPresentation: { $avg: '$presentation' },
            avgService: { $avg: '$service' },
            avgAmbience: { $avg: '$ambience' },
            noOfReviews: { $sum: 1 },
            place: { $first: '$place' },
            placeItem: { $first: '$placeItem' },
            noOfReviewPhotos: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      { $type: 'medias' },
                      'missing',
                    ],
                  },
                  0,
                  { $size: '$medias' },
                ],
              },
            },
          },
        },
      ]);
      log.trace('In review.service, updateRating(), calculated rating for last 3 months: ', avgRatings);

      let filter: FilterQuery<any>;
      if(avgRatings[0].placeItem) {
        filter = { placeItem: { _id: avgRatings[0].placeItem } }
      } else {
        filter = { place: { _id: avgRatings[0].place }, placeItem: null };
      }


      log.trace('Find if an entry with that place/item exists in PlaceItemRating with filter: ', filter);
      let rating: IPlaceItemRating | null = await PlaceItemRating.findOne(filter, null, {
        lean: true,
      });

      if(rating) {
        log.trace('Found a rating entry to update, id: ', rating._id);
        rating = {
          ...rating,
          noOfReviews: avgRatings[0].noOfReviews,
          noOfReviewPhotos: avgRatings[0].noOfReviewPhotos,
          taste: query.item ? avgRatings[0].avgTaste : null,
          presentation: query.item ? avgRatings[0].avgPresentation : null,
          service: avgRatings[0].avgService,
          ambience: avgRatings[0].avgAmbience,
          modifiedAt: new Date(),
        } as IPlaceItemRating;
        await PlaceItemRating.findByIdAndUpdate(rating._id, rating, { upsert: true });

      } else {
        log.trace('Creating new rating record for the place/placeItem:: %s / %s',avgRatings[0].place, avgRatings[0].placeItem);
        rating = {
          place: avgRatings[0].place,
          placeItem: avgRatings[0].placeItem,
          noOfReviews: avgRatings[0].noOfReviews,
          noOfReviewPhotos: avgRatings[0].noOfReviewPhotos,
          taste: query.item ? avgRatings[0].avgTaste : null,
          presentation: query.item ? avgRatings[0].avgPresentation : null,
          service: avgRatings[0].avgService,
          ambience: avgRatings[0].avgAmbience,
          createdAt: new Date(),
          modifiedAt: new Date(),
        } as IPlaceItemRating;
        await PlaceItemRating.create(rating);

      }
      log.debug('Updating PlaceItemRating table with ratings, ', rating?._id);
      // if (avgRatings[0].placeItem) { // create/update a rating record with just place's rating
      //   log.trace('Updating PlaceItem Rating table with Place\'s ratings, ', {place: query.place});
      //   await this.updateRating({place: query.place});
      // }
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
      const reviewz = await Review.findByIdAndUpdate(id, data, {
        new: true,
      });
      log.trace('In review.service->updateReview(), result: ', reviewz);
      await Review.populate(reviewz, { path: 'info' + ' ' + populate });
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
