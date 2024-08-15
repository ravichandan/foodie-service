import mongoose from 'mongoose';

import { Document, Schema, Model, model } from 'mongoose';

export type ICitySuburb = Document & {
  city: string;
  country: string;
  name: string;
  postcode: string;
  surroundingSuburbs: [string];
  createdAt: Date;
  modifiedAt: Date;
};

// Model schemas
export const suburbSchema: Schema<ICitySuburb> = new mongoose.Schema<ICitySuburb>(
  {
    // _id: Number, // Don't use _id explicitly, let mongoose create it

    // includes name of the suburb
    name: {
      type: String,
      required: true,
    },
    // includes city of the suburb
    city: {
      type: String,
      required: true,
    },

    // includes country of the suburb
    country: {
      type: String,
      required: true,
    },

    // tells postcode of the suburb
    postcode: {
      type: String,
    },

    // list of names of surrounding suburbs
    surroundingSuburbs: {
      type: [String],
      validate: (v: String) => Array.isArray(v), // && v.length > 0,
    },

    createdAt: {
      type: Date,
      // required: true,
    },

    modifiedAt: {
      type: Date,
      // required: true,
    },
  },
);

//creating the Suburb model by passing suburbSchema
export const Suburb: Model<ICitySuburb> = model<ICitySuburb>('Suburbs', suburbSchema);
