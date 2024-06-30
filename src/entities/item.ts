import mongoose, { Document, Model, model, Schema } from 'mongoose';
// import Inc from 'mongoose-sequence';
import { IMedia, mediaSchema } from './media';
import { IPlace } from './place';

const uc = <T extends string>(x: T) => x.toUpperCase() as Uppercase<T>;

const x: 'FOO' = uc('foo'); // okay
type ItemCategoryKeys = keyof typeof ItemCategory;
type CuisineKeys = keyof typeof Cuisine;

const getCategory = (key: string) => {
  const c: ItemCategory = ItemCategory[key.toUpperCase() as ItemCategory];
};

export enum ItemCategory {
  MAINS = 'MAINS',
  STARTER = 'STARTER',
  DRINKS = 'DRINKS',
}

export enum Cuisine {
  ITALIAN = 'ITALIAN',
  INDIAN = 'INDIAN',
  CHINESE = 'CHINESE',
  JAPANESE = 'JAPANESE',
  ASIAN = 'ASIAN',
  INDO_CHINESE = 'INDO_CHINESE',
  INDO_ITALIAN = 'INDO_ITALIAN',
  MIDDLE_EAST = 'MIDDLE_EAST',
  MEXICAN = 'MEXICAN',
  GREEK = 'GREEK',
  AFRICAN = 'AFRICAN',
}

// creating interfaces for entities
export type IItem = Document & {
  // _id: number;
  correlationId: string;

  // under which cuisines this item falls in
  cuisines: Cuisine[];

  aliases: string[];
  /**
   * Indicates whether is a starter or drinks or main course, etc
   */
  category: ItemCategory;

  // name of the item
  name: string; // max 100 chars

  // general description of the item like how its made or its origin, etc
  description: string;

  // medias of the place given by that Place
  media: IMedia;

  createdAt: Date;
  modifiedAt: Date;
};

// Model schemas
const itemSchema: Schema<IItem> = new Schema<IItem>(
  {
    // _id: Number,

    // correlationId: {
    // 	type: String,
    // },

    name: {
      type: String,
      required: true,
    },

    aliases: {
      type: [String],
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    cuisines: {
      type: [String],
      enum: Object.values(Cuisine),
      validate: (c: Cuisine) => Array.isArray(c) && c.length > 0,
    },
    category: {
      type: String,
      enum: Object.values(ItemCategory), //['MAINS', 'STARTER', 'DRINKS'],
      required: true,
    },
    media: {
      type: mediaSchema,
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
  {},
);

// @ts-ignore
// const AutoIncrement = Inc(mongoose);
// @ts-ignore
// itemSchema.plugin(AutoIncrement, { id: 'item_id_counter', inc_field: '_id' });

//creating the Place model by passing placeSchema
export const Item: Model<IItem> = model<IItem>('Item', itemSchema);

// var mongoose = require('mongoose');
// var Schema = mongoose.Schema;
