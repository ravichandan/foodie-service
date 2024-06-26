import mongoose, { Document, Model, model, Schema } from 'mongoose';
import Inc from 'mongoose-sequence';
import { IMedia } from './media';
import { customerSchema, ICustomer } from './customer';
import { IReview, reviewSchema } from './review';

// creating interfaces for entities
export type IReviewThread = Document & {
  _id: number;

  /**
   * correlationId to match requests
   */
  correlationId: string;

  /**
   * Reference of Review entity
   */
  review: number;
  // IReview;

  /**
   * the text reply or conversation text
   */
  message: string;

  /**
   * Any attachment for this message in the thread
   */
  media: IMedia;

  /**
   * Reference of Customer entity
   */
  customer: number;
  //ICustomer;

  /**
   * List of customers that liked this review3
   */
  likedBy: ICustomer[];

  /**
   * All the 'replies' given on this review.
   */
  replies: IReviewThread[];

  /**
   * One review entry where this review is a reply on.
   */
  repliedOn: IReviewThread | null;

  createdAt: Date;
  modifiedAt: Date;
};

// Model schemas
export const reviewThreadSchema: Schema<IReviewThread> = new Schema<IReviewThread>(
  {
    _id: Number,

    correlationId: {
      type: String,
    },

    review: {
      type:
        // Schema.Types.ObjectId
        Number,
      // reviewSchema
      ref: 'Review',
    },

    message: {
      type: String,
      required: false,
    },
    media: {
      type:
        // Schema.Types.ObjectId
        Number,
      ref: 'Media',
    },

    customer: {
      type:
        // Schema.Types.ObjectId
        Number,
      // customerSchema
      ref: 'Customer',
    },

    likedBy: {
      type:
        // Schema.Types.ObjectId
        [customerSchema],
      validate: (v: ICustomer) => Array.isArray(v), // && v.length > 0,
    },

    replies: {
      type: [reviewSchema],
      validate: (v: IReviewThread) => Array.isArray(v), // && v.length > 0,
    },

    repliedOn: {
      type: Number,
      ref: 'ReviewThread', // && v.length > 0,
    },

    createdAt: {
      type: Date,
      required: true,
    },

    modifiedAt: {
      type: Date,
      required: true,
    },
  },
  { _id: false },
);

// @ts-ignore
// const AutoIncrement = Inc(mongoose);
// @ts-ignore
// reviewThreadSchema.plugin(AutoIncrement, { id: 'review_thread_id_counter', inc_field: '_id' });

//creating the Review model by passing reviewSchema
export const ReviewThread: Model<IReviewThread> = model<IReviewThread>('ReviewThread', reviewThreadSchema);
