import mongoose from 'mongoose';

import { Document, Schema, Model, model } from 'mongoose';
import Inc from 'mongoose-sequence';
// import Joi from 'joi';

// export const MediaSchemaValidate = Joi.object({
//   // id of the media
//   // mediaId: Joi.string().required(),
//
//   // url of the media
//   url: Joi.string().required(),
//   type: Joi.string(),
//
//   placeId: Joi.string(),
//   itemId: Joi.string(),
//   reviewId: Joi.string(),
//   customerId: Joi.string(),
//   correlationId: Joi.string(),
//   createdAt: Joi.date(),
//   modifiedAt: Joi.date(),
// });

export type IMedia = Document & {
  // _id: any;
  // mediaId: number;
  url: string;
  type: 'image' | 'video' | undefined;
  place: number;
  item: number;
  review: number;
  customer: number;
  // correlationId: string;
  createdAt: Date;
  modifiedAt: Date;
};

// Model schemas
export const mediaSchema: Schema<IMedia> = new mongoose.Schema<IMedia>(
  {
    _id: Number,

    // includes url of the storage location like s3 bucket
    url: {
      type: String,
      required: true,
    },

    // tells whether it is an image or video
    type: {
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

    review: {
      type:
        // Schema.Types.ObjectId
        Number,
      ref: 'Review',
    },

    customer: {
      type:
        // Schema.Types.ObjectId
        Number,
      ref: 'Customer',
    },

    // correlationId to match different requests in a session
    // correlationId: {
    // 	type: String,
    // 	required: function() {
    // 		return !(this.place ||this.item||this.review||this.customer);
    // 	}
    // },

    createdAt: {
      type: Date,
      // required: true,
    },

    modifiedAt: {
      type: Date,
      // required: true,
    },
  },
  { _id: false },
);

// @ts-ignore
const AutoIncrement = Inc(mongoose);
// @ts-ignore
mediaSchema.plugin(AutoIncrement, {
  id: 'media_id_counter',
  inc_field: '_id',
  seq: 1,
});
// mediaSchema.index({ _id: 1, seq: 1 }, { unique: true })

//creating the Place model by passing placeSchema
export const Media: Model<IMedia> = model<IMedia>('Media', mediaSchema);
