// creating interfaces for entities
import mongoose, { Document, Model, model, Schema } from 'mongoose';
import { IPlace } from './place';
import Inc from 'mongoose-sequence';
import { IPlaceItem } from './placeItem';

/**
 * Stores ratings for Place and Item for the last 3 months
 */
export type IPlaceItemRating = Document & {
  // _id: number;
  place: IPlace;
  placeItem: IPlaceItem;
  taste: number;
  presentation: number;
  service: number;
  ambience: number;
  noOfReviews: number;
  createdAt: Date;
  modifiedAt: Date;
};

/**
 * Stores ratings for Place and Item for the last 3 months
 */
const placeItemRatingSchema: Schema<IPlaceItemRating> = new Schema<IPlaceItemRating>(
  {
    // _id: Number,
    place: {
      type:
        Schema.Types.ObjectId,
        // Number,
      ref: 'Place',
    },
    placeItem: {
      type:
        Schema.Types.ObjectId,
        // Number,
      ref: 'Place_Item',
    },
    noOfReviews: Number,
    taste: Number,
    presentation: Number,
    service: Number,
    ambience: Number,
  },
  {
    // _id: false,
  },
);

// @ts-ignore
// const AutoIncrement = Inc(mongoose);
// @ts-ignore
// placeItemRatingSchema.plugin(AutoIncrement, { id: 'place_item_rating_id_counter', inc_field: '_id' });

//creating the Place model by passing placeSchema
export const PlaceItemRating: Model<IPlaceItemRating> = model<IPlaceItemRating>(
  'Place_Item_Rating',
  placeItemRatingSchema,
);
