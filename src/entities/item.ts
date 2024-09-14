import mongoose, { Document, Model, model, Schema } from 'mongoose';
// import Inc from 'mongoose-sequence';
import { IMedia, mediaSchema } from './media';
import { IPlace } from './place';

const uc = <T extends string>(x: T) => x.toUpperCase() as Uppercase<T>;

const x: 'FOO' = uc('foo'); // okay
type ItemCourseKeys = keyof typeof ItemCourse;
type CuisineKeys = keyof typeof Cuisine;

const getCourse = (key: string) => {
  const c: ItemCourse = ItemCourse[key.toUpperCase() as ItemCourse];
};
export const getCuisine = (key: string): Cuisine => {
  const c: Cuisine = Cuisine[key.toUpperCase() as Cuisine];
  return c;
};

export enum ItemCourse {
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
  course: ItemCourse;


  // name of the item
  name: string; // max 100 chars

  // general description of the item like how its made or its origin, etc
  description: string;

  // medias of the place given by that Place
  media: IMedia;

  vegan: boolean;
  vegetarian: boolean;
  eggitarian: boolean;
  pollotarian: boolean;
  pescatarian: boolean;

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
    course: {
      type: String,
      enum: Object.values(ItemCourse), //['MAINS', 'STARTER', 'DRINKS'],
      required: false,
    },

    vegan: Boolean,
    vegetarian: Boolean,
    eggitarian: Boolean,
    pollotarian: Boolean,
    pescatarian: Boolean,

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

//creating the Place model by passing placeSchema
export const Item: Model<IItem> = model<IItem>('Item', itemSchema);
