import { Review } from '../entities/review';
import { Logger } from 'log4js';
import { getLogger } from '../utils/Utils';
import { IReviewThread, ReviewThread } from '../entities/reviewThread';

const log: Logger = getLogger('reviewThread.service');

export class ReviewThreadService {
  //create a review thread
  async createThread(data: IReviewThread): Promise<IReviewThread> {
    log.trace('Request received in createThread, data: ', data);
    try {
      data.createdAt = new Date();
      data.modifiedAt = new Date();
      const newThread = await ReviewThread.create(data);
      log.debug('Thread created successfully returning created object. new thread: ', newThread);
      return newThread;
    } catch (error) {
      log.error('Error while adding a review. Error: ', error);
      throw error;
    }
  }

  //add a thread to a parent review
  async addThread(params: { reviewId: string; thread: IReviewThread }): Promise<IReviewThread> {
    log.trace('Request received in addThread, reviewId: %s, thread: %s', params.reviewId, params.thread);
    if (!params.reviewId) {
      log.error('reviewId is not provided. Treating this as a new Review Thread which will be the parent');
      return this.createThread(params.thread);
    }
    const data = params.thread;
    try {
      data.createdAt = new Date();
      data.modifiedAt = new Date();
      const parent = await this.getThreadByReviewId(+params.reviewId);
      data.repliedOn = parent;
      const newThread: IReviewThread = await ReviewThread.create(data);
      log.debug('Thread created successfully, setting this reference to parent document. new thread: ', newThread);
      if (parent) {
        if (!parent.replies) parent.replies = [];
        parent.replies.push(newThread);
        await parent.save();
      }
      return newThread;
    } catch (error) {
      log.error('Error while adding a review. Error: ', error);
      throw error;
    }
  }

  //get a single review
  async getThread(id: number, populate: boolean = false): Promise<IReviewThread | null> {
    if (!id) {
      log.error('id has to be provided to query a Review document');
      throw new Error('id has to be provided to query a Review document');
    }
    try {
      let review: IReviewThread | null;
      review = populate ? await ReviewThread.findById(id).populate('replies') : await ReviewThread.findById(id);

      log.trace('Found review: ', review);
      return review;
    } catch (error) {
      log.error('Error while fetching Review with id: ' + id, error);
      throw error;
    }
  }

  //get a single review
  async getThreadByReviewId(reviewId: number, populate: boolean = false): Promise<IReviewThread | null> {
    if (!reviewId) {
      log.error('reviewId has to be provided to query a Review document ');
      throw new Error('reviewId has to be provided to query a Review document');
    }
    try {
      const result = //populate
        // ?
        // await ReviewThread.find({ review: reviewId }).populate('replies')
        // 	:
        await ReviewThread.findOne({ review: reviewId });

      log.trace('Found review: ', result);
      return result;
    } catch (error) {
      log.error('Error while fetching Review with reviewId: ' + reviewId, error);
      throw error;
    }
  }

  //update a review
  async updateThread(id: number, data: any): Promise<IReviewThread | undefined> {
    log.debug('Received request to update a Thread with id: ', id);
    try {
      //pass the id of the object you want to update
      //data is for the new body you are updating the old one with
      //new:true, so the dats being returned, is the update one
      log.trace('Updating a ReviewThread id: ' + id + ' with data: ', data);
      const thread = await ReviewThread.findByIdAndUpdate(id, data, {
        new: true,
      });
      log.trace('In reviewThread.service, updateThread(), result: ', thread);

      return thread ?? undefined;
    } catch (error) {
      log.error('Error while updating ReviewThread with id: ' + id + '. Error: ', error);
    }
  }

  //delete a review thread by using the find by id and delete
  async deleteThread(id: string): Promise<IReviewThread | undefined> {
    log.debug('Received request to delete a Thread with id: ', id);
    try {
      const thread = await ReviewThread.findByIdAndDelete(id);
      if (!thread) {
        log.trace('Delete failed, ReviewThread with id: ' + id + ' not found');
        return undefined;
      }
    } catch (error) {
      log.error('Error while deleting ReviewThread with id: ' + id + '. Error: ', error);
    }
  }
}

//export the class
export const reviewThreadService = new ReviewThreadService();
