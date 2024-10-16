import { reviewService } from '../services/review.service';
import { Request, Response } from 'express';
import { IReview } from '../entities/review';
import { mediaService } from '../services/media.service';
import { calculatePoints, getLogger, isImage, isVideo, reviewToReviewModel } from '../utils/Utils';
import { Logger } from 'log4js';
import { IMedia } from '../entities/media';
import { customerService } from '../services/customer.service';
import { ReviewModel } from '../models/reviewModel';
import { reviewModelToReviewEntity } from '../utils/Utils';
import { reviewThreadService } from '../services/reviewThread.service';
import { Customer, ICustomer } from '../entities/customer';
import { IReviewThread } from '../entities/reviewThread';
import { activityService } from '../services/activity.service';
import { IActivity } from '../entities/activity';
import { activityController } from './activity.controller';
import { HTTPClientError } from '../utils/errorHttp';
import { HTTP500Error } from '../utils/error4xx';
import { PlaceItem } from '../entities/placeItem';

const log: Logger = getLogger('review.controller');

class ReviewController {
  //addReview controller
  addReview = async (req: Request, res: Response) => {
    //data to be saved in database
    log.debug('Adding correlationId into the request body');

    // Presuming review would always have a rating.
    // let points = calculatePoints('rate');

    let data = {
      correlationId: req.header('correlationId'),
      customer: req.header('CUSTOMER_ID'),
      ...req.body,
      
      // cuisines: [...req.body.cuisines.map((c: any) => Cuisine[c.toUpperCase() as Cuisine])],
    };
    let points = calculatePoints(data);//data.description ? 'review' : undefined);
    data = reviewModelToReviewEntity(data);
    //call the add review function in the service and pass the data from the request
    try {
      log.trace('Creating a parent Review with given data: ', data);

      let parent: IReview | undefined = await reviewService.addReview({ ...data, children: [] });

      log.trace('Updating rating table for place.');
      await reviewService.updateRating({ place: parent.place });

      log.trace('Splitting place and items separately and creating Child review records');
      if(data.children){
        for (const child of data.children) {
          log.trace('Child record:: ', child);

          child.place = data.place;
          child.service = null;
          child.ambience = null;
          child.helpful = data.helpful;
          child.notHelpful = data.notHelpful;
          child.likedBy = data.likedBy;
          child.customer = data.customer;
          child.parent = parent.id;
          // fetch placeItem record
          if(!child.placeItem){
            const placeItem = await PlaceItem.findOne({place: child.place, item: child.item}, '_id', { lean: true});
            if(!placeItem) {log.error('PlaceItem not found for given place and item'); throw new Error('PlaceItem not found for given place and item')}
            child.placeItem = placeItem?._id;
          }
          
          try {
            const childRecord = await reviewService.addReview(child);
            parent.children.push(childRecord);
          } catch (error: any) {
            log.error('Failed to add Review for child item, data.item: ' + data.item, error);
          }
          for (const m of child.medias) {
            // points += calculatePoints('rate');
            m.item = child.item;
            m.place = child.place;
            m.customerId = child.customer;
            m.type = isImage(m.url) ? 'image' : isVideo(m.url) ? 'video' : undefined;
            // m.type = ;
            // points += calculatePoints(m.type);
            try {
              await mediaService.updateMedia(m.id, m);
            } catch (error: any) {
              log.error('Failed to update media record with media.id: ' + m.id, error);
            }
          }
          points += calculatePoints(child);

          // update PlaceReviewRating mapping
          log.trace('Updating rating table for place and item, item: ', child.item?.id);
          try {
            await reviewService.updateRating({ place: child.place, placeItem: child.placeItem });
          } catch (error: any) {
            log.error('Failed to update rating table with itemId: ' + child.item.id, error);
          }
        }
      }
      for (const m of parent.medias) {
        m.place = parent.place;
        m.customer = parent.customer;
        m.type = isImage(m.url) ? 'image' : isVideo(m.url) ? 'video' : undefined;
        // m.type = ;
        // points += calculatePoints(m.type);
        try {
          await mediaService.updateMedia(m.id, m);
        } catch (error: any) {
          log.error('Failed to update media record with media.id: ' + m.id, error);
        }
      }

      try {
        // const cust = await customerService.getCustomer(''+parent.customer);
        const th = {
          review: parent.id,
          customer: parent.customer,
        }; // as IReviewThread;
        await reviewThreadService.createThread(th as IReviewThread);
      } catch (error: any) {
        log.error('Failed to create IReviewThread record with review id: ' + parent.id, error);
      }
      parent = await reviewService.updateReview(parent.id, parent);

      if (!parent) {
        log.error('Review not created due to previous errors, returning 500');
        res.status(500).send('Review not created');
        return;
      } else {
        log.info('Review created successfully, returning the new object');
        // res.status(201).send(parent);
        res.status(201).send(parent.toObject());

        // Add activity entry for this new review.
        activityController.addNewReviewActivity(parent, points);
      }
    } catch (error: any) {
      log.error('Error while creating review records ', error);
      const err = new HTTP500Error(error)
      res.status(err.statusCode).send(error);
    }
  };

  //get all reviews
  getReviews = async (req: Request, res: Response) => {
    const {
      placeId,
      itemId,
      pageNumber = 1,
      pageSize = 10,
    }: {
      placeId: number;
      itemId?: number;
      pageNumber: number;
      pageSize: number;
    } = {
      ...req.params,
      ...req.query,
    } as any;
    const reviews = await reviewService.getReviews({ placeId, itemId, pageNumber, pageSize });
    res.send(reviews);
  };

  //get all reviewMedias
  getReviewMedias = async (req: Request, res: Response) => {
    const {
      placeId,
      itemId,
      pageNumber = 1,
      pageSize = 10,
    }: {
      placeId: string;
      itemId: string;
      pageNumber: number;
      pageSize: number;
    } = {
      ...req.params,
      ...req.query,
    } as any;
    const reviews = await reviewService.getReviewMedias({ placeId, itemId, pageNumber, pageSize });
    res.send(reviews);
  };

  //get a single review
  getAReview = async (req: Request, res: Response) => {
    //get id from the parameter
    const id = req.params.reviewId;
    const review = await reviewService.getReview({ id: id });
    res.send(review);
  };

  //update review
  updateReview = async (req: Request, res: Response) => {
    const id = +req.params.id;
    const data: ReviewModel = req.body;

    const liked = data.likedBy.find((c) => c.id === data.customerInfo.id);
    const thread = await reviewThreadService.getThreadByReviewId(data.id);
    if (liked) {
      const cust = await customerService.getCustomer({ id: ''+data.customerInfo.id });
      // const thread = await reviewThreadService.getThreadByReviewId(data.id);
      cust && thread?.likedBy.push(cust) && thread?.save();
      // thread?.save();
    } else {
      log.trace('review.controller-> updatereview(), in else, thread: ', thread);
      // const cust = await customerService.getCustomer(''+data.customerInfo.id)
      const index = thread?.likedBy.findIndex((l) => {
        return l.id == data.customerInfo.id;
      });
      log.trace('review.controller-> updatereview(), in else, index: ', index);
      if (typeof index === 'number' && index > -1) {
        // only splice array when item is found
        thread?.likedBy.splice(index, 1); // 2nd parameter means remove one item only
      }
    }

    thread?.save();

    // let review:IReview|undefined =  reviewModelToReviewEntity(data);
    const review: IReview | null = await reviewService.getReview({ id: data.id });

    // review = await reviewService.updateReview(id, review);
    res.send(review);
  };

  //delete a review
  deleteReview = async (req: Request, res: Response) => {
    const id = req.params.id;
    await reviewService.deleteReview(id);
    res.send('review deleted');
  };

  async feedbackReview(customerId: string,reviewId: string, action: string) {
    log.info('Giving feedback: "%s" for reviewId: %s by customer: ', action, reviewId, customerId);

    const cust = await customerService.getCustomer({ id: '' + customerId });
    if(!cust) return undefined;

    const review = await reviewService.getReview({id: reviewId});
    if(!review) return undefined;
    // const customer = await customer.getReview({id: reviewId});
    let thread = await reviewThreadService.getThreadByReviewId(reviewId);
    if(!thread){
      try {
        thread = await reviewThreadService.createThread({
          message: review.description,
          media: review.medias[0],
        } as IReviewThread);
      } catch ( err: any){
        log.error(err.message);
        throw err;
      }
    }


    switch (action?.toLowerCase()) {
      case 'like': {
        log.trace('Before adding to likedBy list, make sure the customer is not in disliked list');
        const index = thread.dislikedBy.findIndex((l) => {
          return l.id == cust.id;
        });
        if (typeof index === 'number' && index > -1) {
          // only splice array when item is found
          thread.dislikedBy.splice(index, 1); // 2nd parameter means remove one item only
        }
        log.trace('look if the customer already in the likedBy list');

        const idx = thread?.likedBy.findIndex((c) => (c._id as any).equals(cust._id))
        if(idx === -1) {
          log.trace('Liking the review for the customer');
          thread.likedBy.push({ _id: cust._id, name: cust.name, email: cust.email, status: cust.status, createdAt: cust.createdAt, modifiedAt: cust.modifiedAt } as ICustomer) && await thread.save();
        }
        break;
      }
      case 'unlike': {
        log.trace('Unliking the review for the customer');
        const index = thread?.likedBy.findIndex((l) => {
          return l.id == cust.id;
        });
        if (typeof index === 'number' && index > -1) {
          // only splice array when item is found
          thread?.likedBy.splice(index, 1); // 2nd parameter means remove one item only
        }
        await thread?.save();
        break;
      }
      case 'dislike': {
        log.trace('make sure the customer is not in likedBy list');
        const index = thread?.likedBy.findIndex((l) => {
          return l.id == cust.id;
        });
        if (typeof index === 'number' && index > -1) {
          // only splice array when item is found
          thread?.likedBy.splice(index, 1); // 2nd parameter means remove one item only
        }
        const idx = thread?.dislikedBy.findIndex((c) => (c._id as any).equals(cust._id))
        if(idx === -1) {
          log.trace('Disliking the review for the customer');
          thread?.dislikedBy.push({ _id: cust._id, name: cust.name, email: cust.email, status: cust.status, createdAt: cust.createdAt, modifiedAt: cust.modifiedAt } as ICustomer) && await thread?.save();
        }
        break;
      }
      case 'undislike': {
        const index = thread?.dislikedBy.findIndex((l) => {
          return l.id == cust.id;
        });
        if (typeof index === 'number' && index > -1) {
          // only splice array when item is found
          thread?.dislikedBy.splice(index, 1); // 2nd parameter means remove one item only
        }
        await thread?.save();
        break;
      }
    }
    if(review && thread) {
      review.helpful = thread.likedBy.length;
      review.notHelpful = thread.dislikedBy.length;
      await review.save().then();
    }

    return review;
  }
}

//export class
export const reviewController = new ReviewController();
