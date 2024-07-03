import { IPlace, Place } from '../entities/place';
import { Logger } from 'log4js';
import { deduceCityName, getLogger } from '../utils/Utils';
import { IMedia } from '../entities/media';

const log: Logger = getLogger('place.service');

export class PlaceService {
  //create a place
  async createPlace(placeData: IPlace): Promise<IPlace> {
    log.debug('Received request to create a Place');
    try {
      placeData.createdAt = new Date();
      placeData.modifiedAt = new Date();
      placeData.address.city = deduceCityName(placeData.address);
      log.trace('Creating Place with data: ', placeData);
      const newPlace: IPlace = await Place.create(placeData);
      await Place.populate(newPlace, 'openingTime');
      log.trace('Place created successfully, returning data');
      return newPlace;
    } catch (error) {
      log.error('Error while create a Place: ', error);
      throw error;
    }
  }

  async getPlaces(params?: {
    placeName?: string;
    postcode?: string;
    pageSize?: number;
    pageNumber?: number;
  }): Promise<IPlace[] | undefined> {
    log.info('Received request to getPlaces, params: ', params);

    const prams: { pageSize: number; pageNumber: number } = {
      ...params,
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 3,
    };
    log.trace('Received request to getPlaces, prams: ', prams);

    try {
      let places;
      if (!!params?.placeName && !!params?.postcode) {
        places = await Place.find({
          placeName: { $regex: params?.placeName, $options: 'i' },
          'address.postcode': params.postcode,
        })
          .populate('address')
          .skip(prams.pageSize * (prams.pageNumber - 1))
          .limit(prams.pageSize)
          .lean()
          .exec();
      } else if (params?.placeName) {
        places = await Place.find({ placeName: { $regex: params?.placeName, $options: 'i' } })
          .populate('address')
          .skip(prams.pageSize * (prams.pageNumber - 1))
          .limit(prams.pageSize)
          .lean()
          .exec();
      } else if (params?.postcode) {
        places = await Place.find({ 'address.postcode': params.postcode })
          .populate('address')
          .skip(prams.pageSize * (prams.pageNumber - 1))
          .limit(prams.pageSize)
          .lean()
          .exec();
      } else {
        places = await Place.find({})
          .populate('address')
          .skip(prams.pageSize * (prams.pageNumber - 1))
          .limit(prams.pageSize)
          .lean()
          .exec();
      }
      log.trace('Returning fetched places');
      return places;
    } catch (error) {
      log.error('Error while doing getPlaces', error);
    }
  }

  async getTopPlaces(args?: {
    city?: string;
    postcode?: string;
  }): Promise<IPlace[] | undefined> {
    log.info('Received request to getTopPlaces, args: ', args);

    const { city, postcode } = { ...args, };

    try {
      let places;
      if (!!postcode) {
        places = await Place.find({
          'address.postcode': postcode,
        })
          .populate('address medias')
          .limit(10)
          .lean()
          .exec();
      } else if (!!city) {
        places = await Place.find({ 'address.city': city })
          .populate('address medias')
          .limit(10)
          .lean()
          .exec();
      }
      log.trace('Returning fetched places');
      return places;
    } catch (error) {
      log.error('Error while doing getPlaces', error);
    }
  }

  //get a single place
  async getPlace(id: string): Promise<IPlace | undefined> {
    if (!id) return undefined;
    log.debug('Received request to get a place with id: ', id);
    try {
      const place = await Place.findById({ _id: id })
        .populate({ path: 'reviews ratings', options: { sort: { createdAt: -1 }, perDocumentLimit: 5 } })
        .populate({
          path: 'items',
          populate: { path: 'medias reviews ratings', options: { sort: { createdAt: -1 }, perDocumentLimit: 5 } },
        })
        .lean();
      if (!place) {
        log.trace('Place not found for id: ', id);
        return undefined;
      }
      log.trace('Fetched a Place id: ' + id + '. place: ', place);
      return place;
    } catch (error) {
      log.error('Error while doing getPlace with id: ' + id + '. Error: ', error);
      throw error;
    }
  }

  //update a place
  async updatePlaceMedias(id: string, media: IMedia): Promise<IPlace | null | undefined> {
    log.debug('Received request to add a media a place with id: ', id);

    try {
      //pass the id of the object you want to update
      //data is for the new body you are updating the old one with
      //new:true, so the dats being returned, is the update one
      log.trace('Updating a place id: ' + id + ' with media: ', media);
      const placez: any = await Place.findByIdAndUpdate(
        { _id: id },
        { $push: { medias: { $each: [media], $sort: -1, $slice: 5 } } },
        {
          new: true,
        },
      );
      log.debug('Successfully updated the Place: ', placez);
      return placez;
    } catch (error) {
      log.error('Error while updating Place with id: ' + id + '. Error: ', error);
      throw error;
    }
  }

  async updatePlace(id: number, data: any): Promise<IPlace | null | undefined> {
    log.debug('Received request to update a place with id: ', id);

    try {
      //pass the id of the object you want to update
      //data is for the new body you are updating the old one with
      //new:true, so the dats being returned, is the update one
      log.trace('Updating a place id: ' + id + ' with data: ', data);
      const placez = await Place.findByIdAndUpdate({ _id: id }, data, {
        new: true,
      });
      log.debug('Successfully updated the Place: ', placez);
      return placez;
    } catch (error) {
      log.error('Error while updating Place with id: ' + id + '. Error: ', error);
    }
  }

  //delete a place by using the find by id and delete
  async deletePlace(id: string): Promise<IPlace | undefined> {
    log.debug('Received request to delete a place with id: ', id);

    try {
      const place = await Place.findByIdAndDelete(id);
      if (!place) {
        log.trace('Delete failed, Place with id: ' + id + ' not found');
        return undefined;
      }
      log.trace('Place with id: ' + id + ' deleted successfully');
      return place;
    } catch (error) {
      log.error('Error while deleting Place with id: ' + id + '. Error: ', error);
    }
  }
}

//export the class
export const placeService: PlaceService = new PlaceService();
