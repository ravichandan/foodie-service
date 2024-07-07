import mongoose, { Document, Model, model, ObjectId, Schema } from 'mongoose';
import Inc from 'mongoose-sequence';
import { IReview, reviewSchema } from './review';
import { customerSchema, ICustomer } from './customer';
import { IReviewThread, reviewThreadSchema } from './reviewThread';

export enum ActivityLevel {
  STARTER = 'STARTER',
  BASIC = 'BASIC',
  FOODIE = 'FOODIE',
  INFLUENCER = 'INFLUENCER',
}

// creating interfaces for entities
export type IActivity = Document & {
  // _id?: number;

  /**
   * Customer id doing the activity
   */
  customer: ObjectId;

  /**
   * 	 review given by this Customer
   */
  review?: ObjectId;

  /**
   * 	 review thread - shows a comment to a review given by this Customer
   */
  thread?: number;

  // review liked by this Customer
  liked?: ObjectId;

  // review liked by this Customer
  unliked?: ObjectId;

  // review liked by this Customer
  disliked?: ObjectId;

  // review liked by this Customer
  undisliked?: ObjectId;

  // Points earned in this activity
  pointsEarned?: number;

  createdAt: Date;
  modifiedAt: Date;
};

// Model schemas
export const activitySchema: Schema<IActivity> = new Schema<IActivity>(
  {
    // _id: Number,

    customer: {
      type:
      Schema.Types.ObjectId,
      // Number,
      ref: 'Customer',
      required: true,
    },

    review: {
      type:
      Schema.Types.ObjectId,
      // Number,
      ref: 'Review',
      // type: reviewSchema,
      // validate: (v: IReview) => Array.isArray(v), // && v.length > 0,
    },

    thread: {
      type:
      Schema.Types.ObjectId,
      // Number,,
      ref: 'ReviewThread',
      // type: reviewThreadSchema
    },

    liked: {
      type: Schema.Types.ObjectId,
      ref: 'Review',
      // type: reviewSchema,
      // validate: (v: IReview) => Array.isArray(v), // && v.length > 0,
    },
    unliked: {
      type: Schema.Types.ObjectId,
      ref: 'Review',
      // type: reviewSchema,
      // validate: (v: IReview) => Array.isArray(v), // && v.length > 0,
    },
    disliked: {
      type: Schema.Types.ObjectId,
      ref: 'Review',
      // type: reviewSchema,
      // validate: (v: IReview) => Array.isArray(v), // && v.length > 0,
    },
    undisliked: {
      type: Schema.Types.ObjectId,
      ref: 'Review',
      // type: reviewSchema,
      // validate: (v: IReview) => Array.isArray(v), // && v.length > 0,
    },

    pointsEarned: {
      type: Number,
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
  { },
);

// customerSchema.virtual('info', {
// 	ref: 'ReviewThread',
// 	localField: '_id',
// 	foreignField: 'likedBy',
//
// });

// @ts-ignore
// const AutoIncrement = Inc(mongoose);
// @ts-ignore
// activitySchema.plugin(AutoIncrement, { id: 'activity_id_counter', inc_field: '_id' });

//creating the Place model by passing placeSchema
export const Activity: Model<IActivity> = model<IActivity>('Activity', activitySchema);

// var mongoose = require('mongoose');
// var Schema = mongoose.Schema;
