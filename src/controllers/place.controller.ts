//import modules
import { placeService } from '../services/place.service';
import { Request, Response } from 'express';
import { IPlace } from '../entities/place';
import { mediaService } from '../services/media.service';
import { IMedia } from '../entities/media';
import * as Utils from '../utils/Utils';
import { Logger } from 'log4js';
import { PlaceModel, PlaceResponse } from '../models/placeModel';
import { IItem } from '../entities/item';
import { itemService } from '../services/item.service';
import { IPlaceItem } from '../entities/placeItem';
import { placeItemService } from '../services/placeItem.service';
import { HTTP400Error, HTTP404Error, HTTP500Error } from '../utils/error4xx';
import { suburbController } from './suburb.controller';
import { ICitySuburb } from '../entities/suburb';
import { suburbService } from '../services/suburb.service';
import { street_types } from '../config/street_types';

const log: Logger = Utils.getLogger('place.controller');

class PlaceController {
  //add place controller
  addPlace = async (req: Request, res: Response) => {
    //data to be saved in database
    log.trace('Adding correlationId into the request body');
    const data: IPlace = {
      correlationId: req.header('correlationId'),
      ...req.body,
    };
    //call the create place function in the service and pass the data from the request
    try {
      let suburbName: string | undefined = data.address?.suburb;
      if(!suburbName?.trim()){
        let suburb=await suburbController.getSuburbFromPostcode(data?.address?.postcode?.toString());
        suburbName = suburb?.name;
      }
      if (suburbName) {
        // Check if the suburb is a known one
        log.trace('Check if the suburb is a known one');
        let suburbs: ICitySuburb[] | undefined = await suburbController.getSuburbsByNames([suburbName]);
        if (!suburbs?.length) {
          // suburb is not known, try to deduce it from street name and postcode
          const line = await this.extractStreetnameFromAddressLine(data.address.line.toLowerCase());

          if (+data.address.postcode < 1) {
            data.address.postcode = /\d{4}/g.exec((data.address as any).formattedAddress)?.[0] ?? ('0' as any);
          }
          const suburbName = await suburbService.getSuburbFromMapsSq(
            line,
            data.address.postcode + '',
            data.address.state ?? 'NSW',
          );
          if (!suburbName) {
            log.error('Check the address, it seems invalid');
            throw new HTTP400Error('Check the address, it seems invalid');
          }
          data.address.suburb = suburbName;
          suburbs = await suburbController.getSuburbsByNames([suburbName]);
        }

        if (suburbs?.length) {
          const subs: string[] = [suburbs[0].name, ...suburbs[0].surroundingSuburbs];
          data.placeName = Utils.cleanPlaceName(data.placeName, subs);
        }
      }

      log.trace('Verify if the place is already existing');
      let existingPlace: any
      if(data.address.location?.latitude && data.address.location?.longitude) {
          existingPlace = await placeService.getPlaceByNameAndGeoLocation({
          name: data.placeName,
          latitude: data.address.location.latitude,
          longitude: data.address.location.longitude,
        });
      }else if(!existingPlace){
        let q: any;
        if(data.address.city){   
          if(q==null) q= {};
          q.city = data.address.city;
        }

        if(data.address.suburb){
          if(q==null) q= {};
          q.suburbs = [data.address.suburb];
        }
        if(data.address.postcode){
          if(q==null) q= {};
          q.postcode = data.address.postcode;
        }
        const places = await placeService.getPlaces({
          placeName: data.placeName,
          ...q,
          latitude: data.address.location?.latitude,
          longitude: data.address.location?.longitude,
        });
        if(places !=null && places.length>0){
          existingPlace = places[0];
        }
      }
      if (existingPlace && existingPlace._id !=null) {
        log.trace('Place already exists with same name and geo-location, update the details');
        const place = {...existingPlace, data};
        await placeService.updatePlace(existingPlace._id, place);
        res.status(201).send(place);
        return;
      }

      const {rating, noOfRatings, ...placeData}:any= data;
      log.trace('Creating a new Place');
      let place: IPlace | null | undefined = await placeService.createPlace(placeData, rating, noOfRatings);
      if (place.medias.length < 1) {
        try {
          // update Media document if it exists.
          log.trace('Fetching Media document with correlationId: ', place.correlationId);
          const media: IMedia | null = await mediaService.getMedia({
            correlationId: place.correlationId,
          });
          if (media) {
            log.trace(
              'Fetched Media document with correlationId: %s, media -> _id: %s',
              place.correlationId,
              media?._id,
            );
            log.trace('Adding placeId and customerId to Media document with _id: %s', place.correlationId, media?._id);
            await mediaService.updateMedia(media._id, {
              placeId: place._id,
              customerId: place.customerId,
            });
            log.trace('Updating Place document with _id: %s to add to medias array', place._id);
            place = await placeService.updatePlaceMedias(place._id, media);
          } else {
            log.error("Couldn't find any media with this correlationId: ", place.correlationId);
          }
        } catch (error: any) {
          log.error('Error while updating Media document with Place id: ' + place?._id, error);
        }
      }
      if (!place) {
        log.info('Place not created due to previous errors, returning 404');
        res.status(404).send('Place could not be added');
      } else {
        log.info('Place created successfully, returning the new object');
        res.status(201).send(place);
      }
    } catch (error: any) {
      log.error('Error while creating place with given data. Error: ', error);
      res.status(error.statusCode ?? 500).send(error.message);
    }
  };

  // updatePlaceMedia = async (req: Request, res: Response) => {
  //
  //   log.trace('Updating Place document with _id: %s to add to medias array', place._id);
  //   place = await placeService.updatePlaceMedias(req.params.placeId, media);
  // }
  /**
   * API Controller method for 'get all places'. This takes at-least one of placeName or postcode, with pagination params
   * This request to query all the places with a name, for ex: Burger, will be sent only from home page search box,
   * when users want to search places (or items in places) by name. In this 'Burger' example, all the places with
   * the name 'Burger' union all the places, (whose names may not have Burger in them), with items' names includes
   * the word 'burger' in them. The result consists of all those above-mentioned places, with at-least 5 items
   * matching the mentioned criteria sorted by highest taste rating first.
   *
   */
  getPlaces = async (args: {
    placeName: string;
    itemName?: string;
    postcode: string;
    suburbs: string[];
    city: string;
		latitude?: number;
		longitude?: number;
		distance?: number;
  }) => {
    log.info('Received request in getPlaces');
    // const { placeName, itemName, postcode, suburbs, city } = {
      // ...req.params,
      // ...req.query,
    //   ...args,
    // } as any;

    // log.trace('Params to getPlaces: ', { placeName, itemName, postcode, city });
    const places: PlaceModel[] | undefined = await placeService.getPlaces(args);
    log.trace('Found the following places with given params', places);
    if (!places) {
      throw new HTTP404Error('Place not found with given id');
      // res.status(404).send('No places found with given criteria');
      // return;
    }

    // if (places.length > 2) {
    const placeResponse: PlaceResponse = {
      places: places, //Utils.placesToPlaceModels(places),
      size: places.length,
      page: 0,
    };
    // res.send(places); // TODO
    return placeResponse;
    // }

    /*log.trace('Only one place found with given criteria, loading its items, reviews and ratings recursively');
    try{
    await Place.populate(places, [
      { path: 'reviews ratings', options: { sort: { createdAt: -1 }, perDocumentLimit: 5 } },
      // {
      //   path: 'items',
      //   populate: { path: 'reviews rating', options: { sort: { createdAt: -1 }, perDocumentLimit: 5 } },
      //   match: (place: IPlace, virtual: any) => ({
      //     ...(!!itemName && { localName: { $regex: itemName, $options: 'i' } }),
      //   }),
      // },
    ]);
    } catch (error: any){
      log.error('Error while populating more fields in to places object. Error: ', error);
      throw new HTTP500Error(error.message);
    }
    log.trace('Loaded all properties for the place, ', places);

    const placeResponse: PlaceResponse = {
      places: Utils.placesToPlaceModels(places),
      size: places.length,
      page: 1,
    };
    console.log('placeResponse:: ', placeResponse);
    // res.send(placeResponse);
    return placeResponse;*/
  };

  /**
   * API Controller method for 'get top 10 searched places'. This takes one of city or postcode, with pagination params
   */
  getPopulars = async (args: { city?: string; postcode?: string; diets?: string;
    	latitude?: number;
		  longitude?: number;
		  distance?: number; }) => {
    log.info('Received request in getPopulars');

    log.trace('Params to getPopulars: ', args);
    const places: PlaceModel[] | undefined = await placeItemService.getPopulars(args);
    log.trace('Found the following popular results with given params', places?.length);
    if (!!places) {
      const placeResponse: PlaceResponse = {
        places: places,
        size: places.length,
        page: 0,
      };
      return placeResponse; // TODO
    }
    return [];
  };

  //get a single place
  getAPlace = async (args: {
    id: string | undefined;
    fetchMenu?: boolean;
    fetchReviews?: boolean;
    size?: number;
    page?: number;
  }) => {
    //get id from the parameter
    const id = args.id;
    log.debug('Querying for a place with id: ', id);
    // try {
    const place = await placeService.getPlace(args);
    if (!place) {
      log.trace('Place not found with given id');
      throw new HTTP404Error('Place not found with given id');
      // res.sendStatus(404);
      // return;
    }
    log.trace('Place found with given id, place: ', place);
    // const placeModel: PlaceModel = placeToPlaceModel(place);
    // log.trace('converted place to placeModel: ', placeModel);
    // return placeModel
    return place;
    // res.send(placeModel);
    // } catch (error: any) {
    //   log.error('getting a place() -> Error while querying for a place with id: ' + id, error);
    //   res.status(500).send(error);
    // }
  };

  //update place
  updatePlace = async (req: Request, res: Response) => {
    const id = +req.params.id;
    const place = await placeService.updatePlace(id, req.body);
    res.send(place);
  };

  //delete a place
  deletePlace = async (req: Request, res: Response) => {
    const id = req.params.id;
    await placeService.deletePlace(id);
    res.send('place deleted');
  };

  //delete a place
  doCorrectPlaceRecords = async (req: Request, res: Response) => {
    // const id = req.params.id;
    const result = await placeService.doCorrectPlaceRecords();
    res.status(204).send(result);
  };

  addItem = async (args: { placeId: string; item: any }) => {
    
    log.info('Received request in PlaceController->addItem() to add the given Item to the given place');
    //data to be saved in database
    // log.debug('Adding correlationId into the request body');

    // create PlaceItem mapping
    const place: IPlace | undefined = await placeService.getPlace({
      id: args.placeId,
      fetchReviews: false,
      fetchMenu: false,
    });
    if (!place) {
      log.error('No Place found with the given placeId: ', args.placeId);
      throw new HTTP404Error(`Place not found with given id: ${args.placeId}`);
    }

    let item;
    if (args.item.id) {
      log.trace('looking for item with id: ', args.item.id);
      item = await itemService.getItem(args.item.id);
      if (!item) {
        log.error('Invalid item reference in the request');
        throw new HTTP400Error('Invalid item reference in the request');
      }
    }
    if (!item && (args.item.name || args.item.aliases)) {
      log.trace("Looking for known 'Item's from name & aliases: ");
      item = await itemService.getItemByNameOrAliases({ name: args.item.name, aliases: args.item.aliases });
    }
    let iItem: any = null;
    if (!item) {
      log.trace('Preparing the item data to create a new one');
      // item = await itemService.getItemByAliases(data.aliases);
      iItem = {
        aliases: [args.item.name],
        name: args.item.name,
        course: args.item.course,
        cuisines: args.item.cuisines,
        uberPopularity: args.item.uberPopularity,
        description: args.item.description,
        media: args.item.medias?.[0],
      };
    }

    //call the create item function in the service and pass the data from the request
    log.trace('Validating Item reference in the request ');
    try {
      if (!item) {
        log.info('Item is not found in inventory, creating it');
        item = await itemService.createItem(iItem as IItem);
        log.trace('Item created successfully in the inventory');
      }

      log.trace('Looking for the place with id: ', args.placeId);

      if (place && item) {
        // first check if the placeItem already exists for this place
        log.trace('Checking if the placeItem is already existing');
        const existingRecord = await placeItemService.getPlaceItemByNameAndPlace({itemName: args.item.name, placeId: place._id});
        if (existingRecord) {
          log.trace('A placeItem already exists for this place, updating it');
          // TODO instead of returning it, update it
          item = {...existingRecord, ...args.item};
          log.trace('Updating PlaceItem document with data: ', item);
          item = await placeItemService.updatePlaceItem(item._id, item);
          log.trace('Successfully updated PlaceItem document.');
        } else {
          // there is no placeItem with this name for this place, create a new one
          const placeItemData: IPlaceItem = {
            place: place,
            item: item,
            name: args.item.name,
            category: args.item.category,
            price: args.item.price ? Number(args.item.price.replace(/[^0-9.-]+/g, '')) : null,
            description: args.item.description,
            uberPopularity: args.item.uberPopularity,
            calorieInfo: args.item.calorieInfo,
            media: args.item.media ? args.item.media : undefined,
          } as IPlaceItem;
          log.trace('Adding PlaceItem document with data: ', placeItemData);
          item = await placeItemService.addPlaceItem(placeItemData);
          log.trace('Successfully added PlaceItem document.');
        }
      }

      log.info('Item created successfully, returning the new object');
      return item;
    } catch (error: any) {
      log.error('Error while adding Item to Place with given data. Error: ', error);
      throw error;
    }
  };

  extractStreetnameFromAddressLine = async (line: string): Promise<string> => {
    // first remove all the street types like Rd, St, Glade from the line
    console.log('\\b(' + street_types.join('|').toLowerCase() + ')\\b$');
    const streetRegex = new RegExp('\\b(' + street_types.join('|').toLowerCase() + ')\\b$', 'i');
    line = line.replace(streetRegex, '').trim();

    // then remove all strings like Unit, etc
    const re = new RegExp('^\\b(unit|flat|ground floor|floor|shop|shop no)\\b', 'i');
    line = line.replace(re, '').trim();

    // then remove all strings like north south if they come at the end of the string , etc
    const newsRegex = new RegExp('\\b(north|east|west|south)\\b$', 'i');
    line = line.replace(newsRegex, '').trim();

    // now remove any numbers, commas and special characters
    line = line.replace(/[^a-zA-Z_ ]/g, '').trim();

    // now split by space and take the longest string as street name

    const parts: any[] = [];
    for (const l of line.split(' ')) {
      await suburbService
        .getSuburbsByNames([l])
        .then(
          (result) =>
            (!result || result.length == 0) &&
            parts.push(l.trim().replace(streetRegex, '').trim().replace(newsRegex, '').trim()),
        );
    }

    // parts = parts.map(async p => (await suburbService.getSuburbsByNames([p])).then(x => return x)  );
    switch (parts.length) {
      case 1:
        line = parts[0];
        break;
      case 2:
        line = parts[0] > parts[1] ? parts[0] : parts[1];
        break;
      case 3:
      case 4:
      case 5:
        line = parts.reduce((a, b) => (a.length > b.length ? a : b));
        break;
      default:
        log.error('Check the address, it seems invalid');
        throw new HTTP400Error('Check the address, it seems invalid');
    }

    return line;
  };
}

//export class
export const placeController = new PlaceController();
