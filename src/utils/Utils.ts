import { NextFunction, Request, Response, Router } from 'express';
import * as log4js from 'log4js';
import { IPlace } from '../entities/place';
import { PlaceModel } from '../models/placeModel';
import { IPlaceItem } from '../entities/placeItem';
import { ItemModel } from '../models/itemModel';
import { IReview } from '../entities/review';
import { ReviewModel } from '../models/reviewModel';
import { IMedia } from '../entities/media';
import { MediaModel } from '../models/mediaModel';
import { CustomerModel } from '../models/customerModel';
import { ICustomer } from '../entities/customer';
import { IActivity } from '../entities/activity';
import { ActivityModel } from '../models/activityModel';

log4js.configure({
  appenders: {
    file: { type: 'file', filename: 'logs/servicelog.log' },
    console: { type: 'console', filename: 'logs/servicelog.log' },
  },
  categories: { default: { appenders: ['console'], level: 'debug' } },
});

export const getLogger = (name?: string) => {
  const logger = log4js.getLogger(name);

  // logger.setLevel('DEBUG');
  logger.level = process.env.LOG_LEVEL || 'info';
  return logger;
};

const logger = getLogger('Utils');
logger.level = process.env.LOG_LEVEL || 'info';

type Wrapper = (router: Router) => void;
type Handler = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;
type Route = {
  path: string;
  method: string;
  validators: any | undefined;
  handler: Handler | Handler[];
};
export const applyMiddleware = (middleware: Wrapper[], router: Router) => {
  for (const f of middleware) {
    logger.debug('In applyMiddleware, f = ' + f);
    f(router);
  }
};

export const applyRoutes = (routes: Route[], router: Router): void => {
  for (const route of routes) {
    const { method, path, validators = undefined, handler } = route;
    logger.debug('In applyRoutes, router = ' + router);

    if (validators) {
      (router as any)[method](path, [...validators], handler);
    } else {
      (router as any)[method](path, handler);
    }
  }
};

export const getJson = (item: any) => {
  logger.trace('Got item: ', item);
  if (!item) {
    logger.trace('Item is not available, returning undefined');
    return undefined;
  }

  if (typeof item === 'object') {
    logger.trace('typeof item is object, returning as-is');
    return item;
  }

  try {
    if (typeof item !== 'string') {
      logger.trace('Item is not of string type. Stringifying item now');
      item = JSON.stringify(item);
    }
    logger.trace('Parsing item');
    item = JSON.parse(item);
  } catch (e) {
    logger.trace('Error while stringifying or parsing item. Item not JSON format: ' + item);
    return undefined;
  }
  logger.trace('typeof object after parsing: ', typeof item);
  if (typeof item === 'object' && item !== null) {
    return item;
  }
  return undefined;
};

export const dateXMonthsBack = (noOfMonthsBack: number) => ({
  $let: {
    vars: {
      todayDate: new Date(),
    },
    in: {
      $dateFromParts: {
        year: { $year: '$$todayDate' },
        month: { $subtract: [{ $month: '$$todayDate' }, noOfMonthsBack] },
        day: { $dayOfMonth: '$$todayDate' },
      },
    },
  },
});
[
  { name: 'a', id: 1 },
  { name: 'b', id: 2 },
  { name: 'c', id: 3 },
].reduce(
  (a, v) => ({
    ...a,
    [v.id]: v,
  }),
  {},
);

export const placeToPlaceModel = (place: IPlace): PlaceModel => {
  if (!place) return {} as PlaceModel;
  const model: PlaceModel = {
    address: { ...place.address },
    ambience: place.ratings ? place.ratings[0]?.ambience : 0,
    noOfReviews: place.ratings?.[0]?.noOfReviews ?? 0,
    description: place.description,
    id: place._id,
    items: itemsToItemModels(place.items)?.reduce(
      (accumulator, value) => ({
        ...accumulator,
        [value.id]: value,
      }),
      {} as any,
    ),
    name: place.placeName,
    openingTimes: place.openingTimes,
    reviews: reviewsToReviewModels(place.reviews),
    service: place.ratings ? place.ratings[0]?.service : 0,
  };
  return model;
};

export const placesToPlaceModels = (places: IPlace[]): PlaceModel[] => {
  const models: PlaceModel[] = places.map((place: IPlace) => placeToPlaceModel(place));
  return models;
};

export const itemToItemModel = (pi: IPlaceItem): ItemModel | undefined => {
  if (!pi) return undefined;
  const model: ItemModel = {
    name: pi.name ?? pi.item?.name,
    description: pi.description || pi.item.description,
    id: pi._id,
    reviews: reviewsToReviewModels(pi.reviews),
    category: pi.item?.category,
    allergens: pi.allergens,
    ingredients: pi.ingredients,
    calorieInfo: pi.calorieInfo,
    price: pi.price,
    taste: pi.ratings ? pi.ratings[0]?.taste : 0,
    cuisine: pi.item?.cuisines?.join(','),
    presentation: pi.ratings ? pi.ratings[0]?.presentation : 0,
    noOfReviews: pi.ratings ? pi.ratings[0]?.noOfReviews : 0,
  };
  return model;
};

export const itemsToItemModels = (items: IPlaceItem[]): ItemModel[] => {
  const models: ItemModel[] = items?.map((item: IPlaceItem) => itemToItemModel(item) as any)?.filter(Boolean);
  return models;
};

export const reviewToReviewModel = (pi: IReview): ReviewModel => {
  if (!pi) return {} as ReviewModel;
  // console.log(' in reviewToReviewModel22: ', (pi instanceof IReview));
  // pi = pi.toObject();
  console.log(' in reviewToReviewModel: ' + pi.place, (pi.place as any) instanceof Number);
  console.log(' in reviewToReviewModel22: ' + typeof pi.place);
  // logger.trace('In Utils->reviewToReviewModel, pi.toObject():: ', pi);
  const model: ReviewModel = {
    // description: pi.description,
    // id: pi.id,
    // taste: pi.taste,
    // presentation: pi.presentation,
    // ambience:pi.ambience,
    // ...pi.toObject(),
    place: typeof pi.place === 'number' ? { id: pi.place } : placeToPlaceModel(pi.place as unknown as IPlace),
    item: typeof pi.item === 'number' ? { id: pi.item } : itemToItemModel(pi.item as unknown as IPlaceItem),
    customerInfo:
      typeof pi.customer === 'number'
        ? { id: pi.customer }
        : customerToCustomerModel(pi.customer as unknown as ICustomer),
    medias: mediasToMediaModels(pi.medias),
    description: pi.description,
    taste: pi.taste,
    service: pi.service,
    ambience: pi.ambience,
    presentation: pi.presentation,
    helpful: pi.helpful,
    notHelpful: pi.notHelpful,
    children: reviewsToReviewModels(pi.children),
    parent: reviewToReviewModel(pi.parent),
    createdAt: pi.createdAt,
    modifiedAt: pi.modifiedAt,

    // placeId:''+pi.place,
    // itemId: ''+pi.item
  } as any;
  return model;
};

export const reviewsToReviewModels = (reviews: IReview[]): ReviewModel[] => {
  const models: ReviewModel[] = reviews?.map((review: IReview) => reviewToReviewModel(review));
  return models;
};

export const reviewModelToReviewEntity = (pi: ReviewModel): IReview => {
  const model: any = {
    // description: pi.description,
    // id: pi.id,
    // taste: pi.taste,
    // presentation: pi.presentation,
    // ambience:pi.ambience,
    ...pi,
    customer: pi.customerInfo?.id,
    // medias: mediaModelsToMediaEntities(pi.medias),
    // service:pi.service,
    // placeId:''+pi.place,
    // itemId: ''+pi.item
  };
  delete model.liked;
  return model as IReview;
};
export const customerToCustomerModel = (pi: ICustomer): CustomerModel => {
  if (!pi) return {} as CustomerModel;
  // pi = pi?.toObject();
  const model: CustomerModel = {
    ...pi,
    id: pi.id || pi._id,
    reviews: reviewsToReviewModels(pi.reviews),
    liked: reviewsToReviewModels(pi.reviews),
    picture: mediaToMediaModel(pi.picture),
    address: { ...pi.address },
  };
  return model;
};

export const customersToCustomerModels = (customers: ICustomer[]): CustomerModel[] => {
  const models: CustomerModel[] = customers?.map((customer: ICustomer) => customerToCustomerModel(customer));
  return models;
};

export const mediaToMediaModel = (pi: IMedia): MediaModel => {
  const model: MediaModel = {
    type: pi.type,
    url: pi.url,
    id: pi.id,
  };
  return model;
};

export const mediasToMediaModels = (medias: IMedia[]): MediaModel[] => {
  const models: MediaModel[] = medias?.map((media: IMedia) => mediaToMediaModel(media));
  return models;
};

export const mediaModelToMediaEntity = (pi: MediaModel): IMedia => {
  const model: IMedia = {
    type: pi.type,
    url: pi.url,
  } as IMedia;
  return model;
};

export const mediaModelsToMediaEntities = (medias: MediaModel[]): IMedia[] => {
  const models: IMedia[] = medias?.map((media: MediaModel) => mediaModelToMediaEntity(media));
  return models;
};

export const activityToActivityModel = (pi: IActivity): ActivityModel => {
  const model: ActivityModel = {
    ...pi.toObject(),
    // customer: {id: pi.customer},
    review: { id: pi.review } as ReviewModel,
    id: pi.id,
  };
  return model;
};

export class ArrayWrapper<T> {
  private items: T[];

  constructor(items: T[]) {
    this.items = items;
  }

  get = (index: number) => this.items[index];
}

export const safeObj = (obj: any) => {
  if (obj) {
    return new Proxy(obj, {
      get: (target, name) => {
        const result = target[name];
        if (result instanceof Array) {
          return new ArrayWrapper(result);
        } else {
          return result;
        }
      },
    });
  }
};

export const calculatePoints = (
  action: 'react' | 'rate' | 'review' | 'comment' | 'image' | 'video' | string | undefined,
): number => {
  switch (action) {
    case 'react':
      return 1;
    case 'rate':
      return 1;
    case 'comment':
      return 1;
    case 'review':
      return 2;
    case 'image':
      return 3;
    case 'video':
      return 5;

    default:
      return 0;
  }
};

export const isImage = (name: string) => {
  return name.match(/\.(jpeg|jpg|gif|png)$/) != null;
};

export const isVideo = (name: string) => {
  return name.match(/\.(mp4|m4a|f4v|m4b|mov)$/) != null;
};
