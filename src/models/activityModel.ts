import { CustomerModel } from './customerModel';
import { ReviewModel } from './reviewModel';

export type ActivityModel = {
  id: number;

  customer: CustomerModel;

  /**
   * 	 review given by this Customer
   */
  review?: ReviewModel;

  /**
   * 	 review thread - shows a comment to a review given by this Customer
   */
  thread?: number;

  // review liked by this Customer
  liked?: ReviewModel;

  // review liked by this Customer
  unliked?: ReviewModel;

  // review liked by this Customer
  disliked?: ReviewModel;

  // review liked by this Customer
  undisliked?: ReviewModel;

  // Points earned in this activity
  pointsEarned?: number;

  createdAt: Date;
  modifiedAt: Date;
};
