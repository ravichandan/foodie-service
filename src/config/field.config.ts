import { Cuisine, ItemCategory } from '../entities/item';
import { Schema } from 'express-validator';
import { CustomerModel } from '../models/customerModel';
import { googleJwtValidator } from '../oidc/JwtValidator';
import { HTTP401Error } from '../utils/error4xx';

const validatePostcodeAndSururb = (_: any, { req }: any) => {
  if (!req.body?.address?.postcode) {
    throw new Error('Postcode is required for the address');
  } else if (req.body?.address?.postcode < 2000 || req.body?.address?.postcode > 2899) {
    throw new Error('Not a valid postcode in this state');
  }
  if (!req.body?.address?.suburb) {
    throw new Error('Sururb is required for the address');
  } else if (req.body?.address?.suburb?.length < 5 || req.body?.address?.suburb?.length > 50) {
    throw new Error('Not a valid suburb in this state');
  }
  return true;
};

const queryParamsHasPostcodeOrSuburb = (_: any, { req }: any) => {
  if (!req.query?.postcode && !req.query?.suburb && !req.query?.city) {
    throw new Error('Either postcode or suburb has to be provided in the query parameters');
  }
  if (req.query?.postcode < 2000 || req.query?.postcode > 2899) {
    throw new Error('Not a valid postcode in this state');
  }
  if (req.query?.suburb?.length < 5 || req.query?.suburb?.length > 50) {
    throw new Error('Not a valid suburb in this state');
  }
  return true;
};

const queryParamsHasPostcodeOrCity = (_: any, { req }: any) => {
  if (!req.query?.postcode && !req.query?.city) {
    throw new Error('Either postcode or city has to be provided in the query parameters');
  }
  if (req.query?.postcode < 2000 || req.query?.postcode > 2899) {
    throw new Error('Not a valid postcode in this state');
  }
  if (req.query?.city?.length < 3 || req.query?.city?.length > 50) {
    throw new Error('Not a valid city in this country');
  }
  return true;
};

export const getItemInPlaceByIdSchemaConfig: Schema = {
  placeId: {
    in: ['params'],
    optional: false,
    errorMessage: 'a place id has to be provided as a path param in the url .../places/:placeId/items/:itemId',
  },
  itemId: {
    in: ['params'],
    optional: false,
    errorMessage: 'an item id has to be provided as a path param in the url .../places/:placeId/items/:itemId',
  },
};
export const getItemInPlaceByPlaceItemIdSchemaConfig: Schema = {
  itemId: {
    in: ['params'],
    optional: false,
    errorMessage: 'an item id has to be provided as a path param in the url .../places/:placeId/items/:itemId',
  },
};
export const getPlaceByIdSchemaConfig: Schema = {
  placeId: {
    in: ['params'],
    optional: false,
    errorMessage: 'a place id has to be provided as a path param in the url .../places/:placeId',
  },
};
export const getPopularPlacesAndItems: Schema = {
  postcode: {
    custom: { options: queryParamsHasPostcodeOrCity }
  },
  city: {
    custom: { options: queryParamsHasPostcodeOrCity }
  }
}
export const getPlaceByNameSchemaConfig: Schema = {
  placeName: {
    in: ['query'],
    optional: false,
    errorMessage: 'place name has to be provided as a query param in the url .../places/?placeName=<value>',
  },
  itemName: {
    in: ['query'],
    optional: true,
    errorMessage: 'item name has to be provided as a query param in the url .../places/?itemName=<value>',
  },
  postcode: {
    custom: { options: queryParamsHasPostcodeOrSuburb },
    // 	in: ['query'],
    // optional: false,
    // errorMessage: 'postcode should be provided to search the place',
    // isInt: true,
    // toInt: true,
  },

  suburb: {
    custom: { options: queryParamsHasPostcodeOrSuburb },
    // 	in: ['query'],
    // optional: false,
    // errorMessage: 'postcode should be provided to search the place',
    // isInt: true,
    // toInt: true,
  },
  pageNumber: {
    in: ['query'],
    optional: true,
    isInt: true,
    toInt: true,
    errorMessage: 'pageNumber in query parameter has to be a number',
  },
  pageSize: {
    in: ['query'],
    optional: true,
    errorMessage: 'pageSize in query parameter has to be a number',
    toInt: true,
  },
};


export const getItemsByNameSchemaConfig: Schema = {
  itemName: {
    in: ['query'],
    optional: true,
    errorMessage: 'item name has to be provided as a query param in the url .../places/?itemName=<value>',
  },
  postcode: {
    custom: { options: queryParamsHasPostcodeOrSuburb },
    // 	in: ['query'],
    // optional: false,
    // errorMessage: 'postcode should be provided to search the place',
    // isInt: true,
    // toInt: true,
  },

  suburb: {
    custom: { options: queryParamsHasPostcodeOrSuburb },
    // 	in: ['query'],
    // optional: false,
    // errorMessage: 'postcode should be provided to search the place',
    // isInt: true,
    // toInt: true,
  },
  pageNumber: {
    in: ['query'],
    optional: true,
    isInt: true,
    toInt: true,
    errorMessage: 'pageNumber in query parameter has to be a number',
  },
  pageSize: {
    in: ['query'],
    optional: true,
    errorMessage: 'pageSize in query parameter has to be a number',
    toInt: true,
  },
};

export const getItemSchemaConfig: Schema = {
  itemId: {
    in: ['params'],
    optional: false,
    errorMessage: 'an itemId has to be provided as a path param in the url .../items/:itemId',
    isLength: { options: { min: 3 } },
  },

  postcode: {
    custom: { options: queryParamsHasPostcodeOrSuburb },
    // 	in: ['query'],
    // optional: false,
    // errorMessage: 'postcode should be provided to search the place',
    // isInt: true,
    // toInt: true,
  },

  suburb: {
    custom: { options: queryParamsHasPostcodeOrSuburb },
    // 	in: ['query'],
    // optional: false,
    // errorMessage: 'postcode should be provided to search the place',
    // isInt: true,
    // toInt: true,
  },
  pageNumber: {
    in: ['query'],
    optional: true,
    isInt: true,
    toInt: true,
    errorMessage: 'pageNumber in query parameter has to be a number',
  },
  pageSize: {
    in: ['query'],
    optional: true,
    errorMessage: 'pageSize in query parameter has to be a number',
    toInt: true,
  },
};

export const addPlaceSchemaConfig = {
  placeName: { isLength: { options: { min: 3, max: 100 } } },
  address: { optional: true },
  'address.line': {
    optional: true,
    isLength: {
      options: { max: 100 },
      errorMessage: "Length can't be more than 100 characters",
    },
  },
  'address.suburb': { custom: { options: validatePostcodeAndSururb } },
  'address.state': {
    optional: true,
    isIn: {
      options: [['NSW']],
      errorMessage: 'Not acceptable state in Australia',
    },
  },
  'address.country': {
    optional: true,
    isIn: { options: [['AU', 'Australia']] },
  },
  'address.postcode': { custom: { options: validatePostcodeAndSururb } },
};

export const addItemSchemaConfig: Schema = {
  name: { isLength: { options: { min: 3, max: 100 } } },
  description: { optional: true, isLength: { options: { max: 300 } } },
  medias: {
    custom: { options: (arr: any[]) => !arr || arr.every((a) => !a?._id || !a?.url) },
    errorMessage: 'If a media file is provided, it should have an id and url',
  },
};

export const createItemSchemaConfig: Schema = {
  name: { isLength: { options: { min: 3, max: 100 } } },
  description: { optional: true, isLength: { options: { max: 300 } } },
  category: {
    custom: {
      options: (val: string, _: any) => !val || Object.keys(ItemCategory).includes(val.toUpperCase()),
      errorMessage: 'Invalid Category',
    },
  },
  cuisines: {
    custom: {
      options: (cuisines: string[], _: any) =>
        !!cuisines && cuisines.length > 0 && cuisines.every((c) => Object.keys(Cuisine).includes(c.toUpperCase())),
      errorMessage: 'Invalid cuisine',
    },
  },
  medias: {
    custom: { options: (arr: any[]) => !arr || arr.every((a) => !a?._id || !a?.url) },
    errorMessage: 'If a media file is provided, it should have an id and url',
  },
};

export const postReviewSchemaConfig: Schema = {
  description: { optional: true, isLength: { options: { max: 300 } } },
  service: { isFloat: { options: { min: 1, max: 5 } } },
  ambience: { isFloat: { options: { min: 1, max: 5 } } },
  taste: { optional: true, isFloat: { options: { min: 1, max: 5 } } },
  presentation: { optional: true, isFloat: { options: { min: 1, max: 5 } } },
  medias: {
    custom: { options: (arr: any[]) => !arr || arr.every((a) => !a?._id || !a?.url) },
    errorMessage: 'If a media file is provided, it should have an id and url',
  },
  // customerInfo: {
  //   optional: false,
  //   custom: {
  //     options: (val: any, _: any) => {
  //       // console.log('postReviewSchemaConfig, val: ', val);
  //       // console.log('postReviewSchemaConfig, (val as CustomerModel).id: ', (val as CustomerModel).id);
  //       // console.log('postReviewSchemaConfig, !!(val as CustomerModel).id: ', !!(val as CustomerModel).id);
  //       return !!val && !!(val as CustomerModel).id;
  //     },
  //   },
  // },
  placeId: { optional: false },
  itemId: { optional: true },
};
export const putReviewSchemaConfig: Schema = {
  ...postReviewSchemaConfig,
  id: { optional: false },
};

export const addCustomerSchemaConfig: Schema = {
  interestedIn: {
    custom: {
      options: (cuisines: string[], _: any) =>
        !!cuisines && cuisines.length > 0 && cuisines.every((c) => Object.keys(Cuisine).includes(c.toUpperCase())),
      errorMessage: 'Invalid cuisine',
    },
  },
  address: { optional: true },
  'address.line': {
    optional: true,
    isLength: {
      options: { max: 100 },
      errorMessage: "Length can't be more than 100 characters",
    },
  },
  'address.suburb': { custom: { options: validatePostcodeAndSururb } },
  'address.state': {
    optional: true,
    isIn: {
      options: [['NSW']],
      errorMessage: 'Not acceptable state in Australia',
    },
  },
  'address.country': {
    optional: true,
    isIn: { options: [['AU', 'Australia']] },
  },
  'address.postcode': { custom: { options: validatePostcodeAndSururb } },
  name: {
    optional: false,
    isLength: {
      options: { min: 4, max: 20 },
      errorMessage: "Length can't be more than 20 characters",
    },
  },
  email: {
    optional: false,
    isEmail: {
      errorMessage: 'Not valid email',
    },
  },
  phone: {
    optional: true,
    isMobilePhone: {
      errorMessage: 'Not valid phone number',
    },
  },
};
export const loginOrSignupOidcCustomerSchemaConfig: Schema = {
  userInfo: {
    in: ['body'],
    optional: false,
    errorMessage: 'userInfo has to be sent along the request',
  },
};

export const getOrPutCustomerByIdSchemaConfig: Schema = {
  customerId: {
    in: ['params'],
    optional: false,
    errorMessage: 'customerId has to be provided as a path param in the url .../customers/:customerId',
    isLength: { options: { min: 3, max: 20 } },
  },
};
export const getReviewByIdSchemaConfig: Schema = {
  reviewId: {
    in: ['params'],
    optional: false,
    errorMessage: 'reviewId has to be provided as a path param in the url .../reviews/:reviewId',
  },
};

export const getCustomerByNameSchemaConfig: Schema = {
  name: {
    in: ['query'],
    optional: false,
    errorMessage:
      'a customer name (or a part of it) has to be provided as a query param in the request like .../customers?name="John"',
    isLength: { options: { min: 3, max: 20 } },
  },
};

const verifyAuthToken = async (_: string, { req, res }: any) => {
  const admin = req.headers['x-admin-name'];
  const token = req.headers['x-token'];
  const isAuthenticated = admin === 'admin' ? true : await googleJwtValidator(token??req.body.userInfo.token);
  if (!isAuthenticated) {
    throw new HTTP401Error();
  }
  return true;
};


export const verifyCustomerIdHeader: Schema = {

  CUSTOMER_ID: {
    in: ['headers'],
    optional: false,
    errorMessage: 'Provide a valid CUSTOMER_ID header',
    isMongoId: true,
  },
};

export const validateAuth: Schema = {
  // 	clientId:{
  // 		in: ['body'],
  // 		optional: true,
  // 		errorMessage: 'User not authorised to do this operation',
  // 	},
  token: { custom: { options: verifyAuthToken } },
};
