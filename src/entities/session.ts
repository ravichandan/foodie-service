import mongoose, { ObjectId } from 'mongoose';

import { Document, Schema, Model, model } from 'mongoose';

export type ISession = Document & {
  session_key: string;
  customer: ObjectId;
  createdAt: Date;
  modifiedAt: Date;
};

// Model schemas
export const sessionSchema: Schema<ISession> = new mongoose.Schema<ISession>(
  {

    session_key: {
      type: String,
      required: false,
    },

    customer: {
      type:
        Schema.Types.ObjectId,
        // Number,
      ref: 'Customer',
      required: true
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

//creating the Place model by passing placeSchema
export const Session: Model<ISession> = model<ISession>('Sessions', sessionSchema);
