import mongoose, { Model, ObjectId } from 'mongoose';

import { Document, Schema, model } from 'mongoose';
// @ts-ignore
import Inc from 'mongoose-sequence';
import { addressSchema, IAddress } from './address';
import { IMedia, mediaSchema } from './media';
import { IPlaceItem } from './placeItem';
import { IReview } from './review';
import { IPlaceItemRating } from './placeItemRating';


export enum FriendlyTag {
	PET = 'Pet Friendly',
	VEGAN = 'Vegan Options',
	KID = 'Kid Friendly',
	DATE = 'Nice For Dates',
}

export enum WeekDays {
	SUNDAY='SUNDAY',
	MONDAY='MONDAY',
	TUESDAY='TUESDAY',
	WEDNESDAY='WEDNESDAY',
	THURSDAY='THURSDAY',
	FRIDAY='FRIDAY',
	SATURDAY='SATURDAY'
}
// o: {[p: string]: WeekDays} | ArrayLike<WeekDays>):
export type OpeningTimes = {
	[p in WeekDays]: {
		open: number;
		close: number;
		mayDiffer: boolean;
	};
};
// creating interfaces for entities
export type IPlace = Document & {
	// placeId: string;
	_id: Number;
	correlationId: string;
	customerId: string;
	// name of the place
	placeName: string; // max 100 chars
	description: string; // max 100 chars

	// medias of the place given by that Place
	medias: IMedia[];
	items: IPlaceItem[];
	reviews: IReview[];
	ratings: IPlaceItemRating[];
	tags: FriendlyTag[];

	openingTimes: OpeningTimes;

	address: IAddress;

	createdAt: Date;
	modifiedAt: Date;
};

const timesSchema: Schema = new Schema({
			open: Number,
			close: Number,
			mayDiffer: Boolean
});

// Model schemas
const placeSchema: Schema<IPlace> = new Schema<IPlace>(
	{
		_id: Number,

		placeName: {
			type: String,
			required: true,
		},
		customerId: {
			type: String,
		},

		correlationId: {
			type: String,
		},
		address: {
			type: addressSchema,
			required: false,
		},
		tags:{
			type: [String],
			enum: Object.values(FriendlyTag),
			validate: (c: FriendlyTag) => Array.isArray(c) && c.length >= 0,
		},
		openingTimes: {
			type: new Schema<OpeningTimes>({
				SUNDAY: timesSchema,
				MONDAY: timesSchema,
				TUESDAY: timesSchema,
				WEDNESDAY: timesSchema,
				THURSDAY: timesSchema,
				FRIDAY: timesSchema,
				SATURDAY: timesSchema,
			})
		},
		medias: {
			type: [mediaSchema],
			validate: (v: IMedia) => Array.isArray(v), // && v.length > 0,
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
	{
		_id: false,
		toJSON: { virtuals: true }, // So `res.json()` and other `JSON.stringify()` functions include virtuals
		toObject: { virtuals: true }
	}
);

placeSchema.virtual('reviews', {
	ref: 'Review',
	localField: '_id',
	foreignField: 'place',
	match: {item: null}
	// match: { archived: false } // match option with basic query selector
});

placeSchema.virtual('items', {
	ref: 'Place_Item',
	localField: '_id',
	foreignField: 'place',
	// match: { archived: false } // match option with basic query selector
});

placeSchema.virtual('ratings', {
	ref: 'Place_Item_Rating',
	localField: '_id',
	foreignField: 'place',
	match: { item: null }
});

// @ts-ignore
const AutoIncrement = Inc(mongoose);
// @ts-ignore
placeSchema.plugin(AutoIncrement, { id: 'place_id_counter', inc_field: '_id' });

//creating the Place model by passing placeSchema
export const Place: Model<IPlace> = model<IPlace>('Place', placeSchema);
