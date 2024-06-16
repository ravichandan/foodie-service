// @ts-ignore
import {AddressModel} from './addressModel';
import {ReviewModel} from './reviewModel';
import {ItemModel} from './itemModel';
import { OpeningTimes } from '../entities/place';

export type PlaceResponse ={
	page: Number;
	size: Number;
	places: PlaceModel[];

}

// Place model, a View Object to return in API response
export type PlaceModel = {
	id: Number;
	name: string;
	address: AddressModel,
	description: string,
	service: Number,
	ambience: Number,
	noOfReviews: Number,
	reviews: ReviewModel[];
	openingTimes: OpeningTimes;
	items: { id: ItemModel }
}
