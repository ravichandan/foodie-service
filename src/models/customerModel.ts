// creating Review model
import { MediaModel } from './mediaModel';
import { Cuisine } from '../entities/item';
import { ReviewModel } from './reviewModel';
import { AddressModel } from './addressModel';
import { ActivityLevel } from '../entities/activity';

export type CustomerModel = {
  id: number;
  username?: string;
  name?: string;
  email?: string;
  phone?: string;
  interestedIn?: Cuisine[];
  reviews?: ReviewModel[];
  liked?: ReviewModel[];
  picture?: MediaModel;
  address?: AddressModel;

  // Total points earned in their lifetime
  totalPointsEarned: number;

  // Current active points that they can claim.
  claimablePoints: number;

  // The current activity level of the user
  level: ActivityLevel;
};

export type CustomerResponse = {
  page: number;
  size: number;
  customers: CustomerModel[];
};
