import mongoose, { Document, Model, model, Schema } from 'mongoose';
// import Inc from 'mongoose-sequence';
import { IMedia, mediaSchema } from './media';
import { customerSchema, ICustomer } from './customer';

// creating interfaces for entities
export type IReview = Document & {
  _id: number;

  /**
   * correlationId to match requests
   */
  correlationId: string;

  /**
   * Reference of Place entity
   */
  place: number;

  /**
   * Reference of Item entity
   */
  item: number;

  /**
   * Reference of Customer entity
   */
  customer: number;

  /**
   * The review description given by the customer
   */
  description: string;

  /**
   * Rating for 'taste'
   */
  taste: number;

  /**
   * Rating for 'presentation'
   */
  presentation: number;
  /**
   * Rating for 'service'
   */
  service: number;
  /**
   * Rating for 'ambience'
   */
  ambience: number;

  /**
   * Indicates how many users find it helpful
   */
  helpful: number;

  /**
   * Indicates how many users find it helpful
   */
  notHelpful: number;

  /**
   * List of customers that liked this review3
   */
  // likedBy: ICustomer[]

  /**
   * All the child review of this review. If a user 'gave' a review of
   * a place and 2 items that they had, the db will have 3 entries in the table - 1 parent
   * review entry and 2 child review entries.
   */
  children: IReview[];

  /**
   * All the child review of this review. If a user 'gave' a review of
   * a place and 2 items that they had, the db will have 3 entries in the table - 1 parent
   * review entry and 2 child review entries.
   */
  parent: IReview;

  /**
   * medias in this review. If the customer is giving reviews to multiple items,
   * then there will be multiple entries in this document, one for every item.
   * A single item in the review can have multiple medias, max 5 medias.
   */
  medias: IMedia[];

  createdAt: Date;
  modifiedAt: Date;
};

// Model schemas
export const reviewSchema: Schema<IReview> = new Schema<IReview>(
  {
    _id: Number,

    correlationId: {
      type: String,
    },

    place: {
      type:
        // Schema.Types.ObjectId
        Number,
      ref: 'Place',
    },
    item: {
      type:
        // Schema.Types.ObjectId
        Number,
      ref: 'Place_Item',
    },
    customer: {
      type:
        // Schema.Types.ObjectId
        Number,
      ref: 'Customer',
    },

    description: {
      type: String,
      required: true,
    },

    taste: Number,
    presentation: Number,
    service: Number,
    ambience: Number,

    helpful: Number,
    notHelpful: Number,

    medias: {
      type: [mediaSchema],
      validate: (v: IMedia) => Array.isArray(v), // && v.length > 0,
    },
    // likedBy: {
    // 	type: [customerSchema],
    // 	validate: (v: ICustomer) => Array.isArray(v), // && v.length > 0,
    // },
    children: [{ type: Number, ref: 'Review' }],
    parent: { type: Number, ref: 'IReview', required: false, default: null },

    createdAt: {
      type: Date,
      required: true,
    },

    modifiedAt: {
      type: Date,
      required: true,
    },
  },
  {
    _id: false,
    toJSON: { virtuals: true }, // So `res.json()` and other `JSON.stringify()` functions include virtuals
    toObject: { virtuals: true },
  },
);

reviewSchema.virtual('info', {
  ref: 'ReviewThread',
  localField: '_id',
  foreignField: 'review',
});

// @ts-ignore
// const AutoIncrement = Inc(mongoose);
// @ts-ignore
// reviewSchema.plugin(AutoIncrement, { id: 'review_id_counter', inc_field: '_id' });

//creating the Review model by passing reviewSchema
export const Review: Model<IReview> = model<IReview>('Review', reviewSchema);
