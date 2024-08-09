import mongoose from 'mongoose';

import { Document, Schema, model, Model } from 'mongoose';
import Inc from 'mongoose-sequence';

export type Location = {
  latitude: string;
  longitude: string;
}
// creating interfaces for entities
export type IAddress = Document & {
  // includes door no, street name, etc
  line: string;

  // Suburb
  suburb: string; // max 50 chars

  // postcode
  postcode: number; // create Index

  // city
  city: string; // max 50 characters

  // state
  state: string; // max 50 characters

  // country
  country: string; // only australia as of now

  location: Location;

  googleMapsUri: string;

  // createdAt: Date;
  // modifiedAt: Date;
};

// Model schemas
export const addressSchema: Schema<IAddress> = new mongoose.Schema<IAddress>(
  {
    // _id: Number,

    // includes door no, street name, etc
    line: {
      type: String,
    },

    // Suburb
    suburb: {
      type: String,
      required: true,
      max: 50,
    }, // max 50 chars

    // postcode
    postcode: {
      type: Number,
    }, // create Index

    // city
    city: {
      type: String,
      max: 50,
    }, // max 50 characters

    // state
    state: {
      type: String,
      max: 50,
    }, // max 50 characters

    // country
    country: {
      type: String,
    }, // only australia as of now

    // country
    location: {
      type: new mongoose.Schema<Location>(
        {
          // _id: Number,

          // includes door no, street name, etc
          latitude: {
            type: String,
          },

          // Suburb
          longitude: {
            type: String,
          }})
    }, // only australia as of now

    // country
    googleMapsUri: {
      type: String,
    }, // only australia as of now

    // createdAt: {
    //   type: Date,
    //   required: true,
    // },
    //
    // modifiedAt: {
    //   type: Date,
    //   required: true,
    // },
  },
  { },
);

// @ts-ignore
// const AutoIncrement = Inc(mongoose);
// @ts-ignore
// addressSchema.plugin(AutoIncrement, { id: 'address_id_counter' });

//creating the Place model by passing placeSchema
export const Address: Model<IAddress> = model<IAddress>('Address', addressSchema);
