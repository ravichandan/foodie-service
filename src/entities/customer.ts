import mongoose, { Document, Model, model, Schema } from 'mongoose';
import Inc from 'mongoose-sequence';
import { IMedia, mediaSchema } from './media';
import { Cuisine } from './item';
import { IReview, reviewSchema } from './review';
import { addressSchema, IAddress } from './address';
import { ActivityLevel } from './activity';

const uc = <T extends string>(x: T) => x.toUpperCase() as Uppercase<T>;

type CuisineKeys = keyof typeof Cuisine;

// creating interfaces for entities
export type ICustomer = Document & {
  // _id: number;
  correlationId: string;

  /**
   * Cuisines that this customer is interested in
   */
  interestedIn: Cuisine[];

  // name of the customer
  name: string; // max 100 chars

  // email of the customer
  email: string;

  // phone of the customer
  phone: string;

  // Address of the customer
  address: IAddress;

  // medias of the place given by that Place
  picture: IMedia;

  // reviews given by this Customer
  reviews: IReview[];

  // reviews liked by this Customer
  liked: IReview[];

  // status of the customer verified|unverified
  status: 'verified' | 'unverified';

  // Total points earned in their lifetime
  totalPointsEarned: number;

  // Current active points that they can claim.
  claimablePoints: number;



  // The current activity level of the user
  level: ActivityLevel;

  createdAt: Date;
  modifiedAt: Date;
};

// Model schemas
export const customerSchema: Schema<ICustomer> = new Schema<ICustomer>(
  {
    // _id: Number,

    correlationId: {
      type: String,
    },

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: false,
    },
    interestedIn: {
      type: [String],
      enum: Object.values(Cuisine),
      validate: (c: Cuisine[]) => !c || Array.isArray(c),
    },
    picture: {
      type: mediaSchema,
      // validate: (v: IMedia) => Array.isArray(v), // && v.length > 0,
    },
    address: {
      type: addressSchema,
      required: false,
    },
    reviews: {
      type: [reviewSchema],
      validate: (v: IReview) => Array.isArray(v), // && v.length > 0,
    },
    // liked: {
    // 	type: [reviewSchema],
    // 	validate: (v: IReview) => Array.isArray(v), // && v.length > 0,
    // },

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

customerSchema.virtual('info', {
  ref: 'ReviewThread',
  localField: '_id',
  foreignField: 'likedBy',
});

// @ts-ignore
// const AutoIncrement = Inc(mongoose);
// @ts-ignore
// customerSchema.plugin(AutoIncrement, { id: 'customer_id_counter', inc_field: '_id' });

//creating the Place model by passing placeSchema
export const Customer: Model<ICustomer> = model<ICustomer>('Customer', customerSchema);

// var mongoose = require('mongoose');
// var Schema = mongoose.Schema;
