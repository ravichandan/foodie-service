// creating Item model
import { ReviewModel } from './reviewModel';
import { CalorieInfo, FoodAllergens } from '../entities/placeItem';

export type ItemResponse = {
  page: number;
  size: number;
  items: ItemModel[];
};

export type ItemModel = {
  id: any;
  name: string;
  category: string;
  cuisine: string;
  description: string;
  taste: number;
  presentation: number;
  noOfReviews: number;
  calorieInfo: CalorieInfo;
  ingredients: string[];
  allergens: FoodAllergens[];
  price: number;
  aliases: string[];
  reviews: ReviewModel[];
};
