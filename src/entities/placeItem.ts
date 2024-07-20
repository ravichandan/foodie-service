// creating interfaces for entities
import mongoose, { Document, Model, model, Schema } from 'mongoose';
import { IPlace } from './place';
import { IMedia, mediaSchema } from './media';
import { Cuisine, IItem, ItemCategory } from './item';
// import Inc from 'mongoose-sequence';
import { IReview } from './review';
import { IPlaceItemRating } from './placeItemRating';

export enum CalorieUnit {
  kJ = 'kJ',
  kcal = 'kcal',
}

export enum Ingredients {
  FLOUR = 'Flour',
  YEAST = 'Yeast',
  WATER = 'Water',
  SALT = 'Salt',
  OLIVE_OIL = 'Olive oil',
  SUGAR = 'Sugar',
  CORNMEAL = 'Cornmeal',
  OIL = 'Oil',
  BAKING_SODA = 'Baking Soda',
  BAKING_POWDER = 'Baking Powder',
  GRANULATED_SUGAR = 'Granulated Sugar',
  BUTTER = 'Butter',
}

export enum FoodAllergens {
  MILK = 'Milk',
  EGGS = 'Eggs',
  FISH = 'Fish',
  SHELLFISH = 'Crustacean shellfish',
  TREENUTS = 'Tree nuts',
  PEANUTS = 'Peanuts',
  WHEAT = 'Wheat',
  SOYBEANS = 'Soybeans',
}

export type CalorieInfo = {
  count: number;
  unit: CalorieUnit;
};
export type IPlaceItem = Document & {
  // _id: number;
  correlationId: string;
  // itemReferenceId: string;
  place: IPlace;
  item: IItem;
  aliases:string[];
  // customised name of the Item in this Place
  name: string;

  category: ItemCategory;
  cuisines: Cuisine[];
  // contains calorie related info
  calorieInfo: CalorieInfo;

  // ingredients of this dish
  ingredients: string[];

  // food allergy causing ingredients
  allergens: FoodAllergens[];

  // price of the item in this place
  price: number;

  // customised description of the Item in this Place
  description: string;
  // cuisines: Cuisine[];
  // category: ItemCategory;
  medias: IMedia[];
  reviews: IReview[];
  rating: IPlaceItemRating;

  createdAt: Date;
  modifiedAt: Date;
};

const placeItemSchema: Schema<IPlaceItem> = new Schema<IPlaceItem>(
  {
    // _id: Number,
    correlationId: {
      type: String,
    },
    place: {
      type:
        Schema.Types.ObjectId,
        // Number,
      ref: 'Place',
    },
    item: {
      type:
        Schema.Types.ObjectId,
        // Number,
      ref: 'Item',
    },
    name: String,
    price: String,
    aliases: [String],
    description: String,
    calorieInfo: new Schema<CalorieInfo>({ count: { type: Number }, unit: { type: String } }),
    ingredients: {
      type: [String],
    },
    // cuisines: {
    // 	type: [String],
    // 	enum: Object.values(Cuisine),
    // 	validate: (c: Cuisine) => Array.isArray(c) && c.length > 0,
    // },
    // category: {
    // 	type: String,
    // 	enum: Object.values(ItemCategory), //['MAINS', 'STARTER', 'DRINKS'],
    // 	required: true,
    // },
    medias: {
      type: [mediaSchema],
      validate: (v: IMedia) => Array.isArray(v), // && v.length > 0,
    },
  },
  {
    // _id: false,
    toJSON: { virtuals: true }, // So `res.json()` and other `JSON.stringify()` functions include virtuals
    toObject: { virtuals: true },
  },
);

placeItemSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'placeItem',
  match: (pi: IPlaceItem) => ({ place: pi.place }),
});

placeItemSchema.virtual('rating', {
  ref: 'Place_Item_Rating',
  localField: 'item',
  foreignField: 'placeItem',
  match: (pi: IPlaceItem) => ({ place: pi.place }),

  // match: { archived: false } // match option with basic query selector
});

// @ts-ignore
// const AutoIncrement = Inc(mongoose);

// @ts-ignore
// placeItemSchema.plugin(AutoIncrement, { id: 'place_item_id_counter', inc_field: '_id' });
export const PlaceItem: Model<IPlaceItem> = model<IPlaceItem>('Place_Item', placeItemSchema);
