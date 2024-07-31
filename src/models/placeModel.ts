// @ts-ignore
import { AddressModel } from './addressModel';
import { ReviewModel } from './reviewModel';
import { ItemModel } from './itemModel';
import { OpeningTimes } from '../entities/place';
import { MediaModel } from './mediaModel';
import { IPlaceItemRating } from '../entities/placeItemRating';

export type PlaceResponse = {
  page: number;
  size: number;
  places: PlaceModel[];
};

// Place model, a View Object to return in API response
export type PlaceModel = {
  _id: string;
  name: string;
  address: AddressModel;
  description: string;
  // service: number;
  // ambience: number;
  // noOfReviews: number;
  medias: MediaModel[];
  reviews: ReviewModel[];
  openingTimes: OpeningTimes;
  placeItems: { id: ItemModel };
  ratingInfo: IPlaceItemRating;
};
