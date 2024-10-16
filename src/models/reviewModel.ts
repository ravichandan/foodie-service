// creating Review model
import { MediaModel } from './mediaModel';
import { CustomerModel } from './customerModel';

export type ReviewModel = {
  // "id": number;
  // "description": string;
  // "service": number;
  // "ambience": number;
  // "taste": number;
  // "presentation": number;
  // "medias": MediaModel[],
  // "placeName": string;
  // "itemName": string;

  id: any;
  description: string;
  service: number;
  ambience: number;
  taste: number;
  presentation: number;
  medias: MediaModel[];
  customerInfo: CustomerModel;
  placeId: any;
  itemId: any;
  helpful: number;
  notHelpful: number;
  likedBy: CustomerModel[];
  parent: ReviewModel;
  children: ReviewModel[];
  createdAt: Date;
  modifiedAt: Date;
};
