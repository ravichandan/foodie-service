import { itemService } from '../services/item.service';
import { Request, Response } from 'express';
import { Cuisine, IItem, ItemCourse } from '../entities/item';
import { mediaService } from '../services/media.service';
import { IMedia } from '../entities/media';
import { getLogger } from '../utils/Utils';
import { Logger } from 'log4js';
import { placeService } from '../services/place.service';
import { placeItemService } from '../services/placeItem.service';
import { PlaceResponse } from '../models/placeModel';

const log: Logger = getLogger('item.controller');

class ItemController {

  //addItem controller
  createItem = async (req: Request, res: Response) => {
    log.info('Received request in ItemController->createItem() to add a new Item to the inventory');
    //data to be saved in database
    log.debug('Adding correlationId into the request body');
    const data: IItem = {
      // correlationId: req.header('correlationId'),
      ...req.body,
      course: ItemCourse[req.body.course.toUpperCase() as ItemCourse],
      cuisines: [...req.body.cuisines.map((c: any) => Cuisine[c.toUpperCase() as Cuisine])],
    };
    //call the create item function in the service and pass the data from the request
    try {
      log.trace('Creating a Item with given data: ', data);
      const item: IItem | null | undefined = await itemService.createItem(data);
      log.trace('Fetching Media document with correlationId: ', item.correlationId);
      const media: IMedia | null = item.media ? await mediaService.getMedia({ id: item.media?.id }) : null;
      !!media && (media.placeItem = item.id) && media?.save();

      if (!item) {
        log.info('Item not created due to previous errors, returning 404');
        res.status(404).send('Item not found');
      } else {
        log.info('Item created successfully, returning the new object');
        res.status(201).send(item);
      }
    } catch (error: any) {
      log.error('Error while creating item with given data. Error: ', error);
      // res.send(error.message);
      throw error;
    }
  };

  //get all items
  getItems = async (req: Request, res: Response) => {
    const items = await itemService.getItems();
    res.send(items);
  };

  //get all items by a matching name
  getItemsByName = async (args : {
    itemName: string,
    postcode?: string, 
    city?: string, 
    suburbs?: string, 
    diets?: string,
		latitude?: number;
		longitude?: number;
		distance?: number;
  }, ) => {
    const items = await itemService.getItemsByName2(args);
    const itemResponse = {
      page: 1,
      size: items?.length ?? 0,
      items: items//!!items? itemsToItemModels(items): [],
      // itemsOriginal: items
    }
    return itemResponse;
    // res.send(items);
  };

  //get a single item
  getAItem = async (req: Request, res: Response) => {
    //get id from the parameter
    // TODO take pagination params and return the data accordingly.
    const id = req.params.itemId;
    const item = await itemService.getItem(id);
    res.send(item);
  };

  //get a single item
  getPlacesOfItem = async (args: { itemId: string, itemName?: string, postcode?: string; city?: string, suburb?: string }) => {
    //get id from the parameter
    // TODO take pagination params and return the data accordingly.
    // const id = req.params.itemId;
    const items = await placeItemService.getPlacesOfAnItem2(args);
    const itemResponse = {
      page: 1,
      size: items?.length ?? 0,
      items: items//!!items? itemsToItemModels(items): [],
      // itemsOriginal: items
    }
    return itemResponse;
    // return item;
  };

  //get a single item by name in a place
  getPlaceItemByNameAndPlaceId = async (args : {placeId: string, itemName: string}) => {
    
    const { placeId, itemName } = { ...args };
    const placeItem = await placeItemService.getPlaceItemByNameAndPlace({ placeId, itemName });

    return placeItem;
    // if(!items){
    //   log.trace('Item not found');
    //   throw new HTTP404Error(`Item not found in given place`);//: ${placeId}, item: ${itemId} `);
    // }
    // return items;
  };
  
  //get a single item
  getAnItemInAPlace = async (args : {placeId?: string, itemId?: string, placeItemId?: string}) => {
    //get id from the parameter
    // TODO take pagination params and return the data accordingly.
    const { placeId, itemId, placeItemId } = { ...args };
    const places = await placeService.getAnItemInAPlace({ placeId, itemId, placeItemId });
    const placeResponse: PlaceResponse = {
      page: 1,
      size: places?.length ?? 0,
      places: places ?? []//!!items? itemsToItemModels(items): [],
      // itemsOriginal: items
    }
    return placeResponse;
    // if(!items){
    //   log.trace('Item not found');
    //   throw new HTTP404Error(`Item not found in given place`);//: ${placeId}, item: ${itemId} `);
    // }
    // return items;
  };

  //update item
  updateItem = async (req: Request, res: Response) => {
    const id = +req.params.id;
    // const existingItem = itemService.getAnItemInAPlace({placeId: })
    const item = await itemService.updateItem(id, req.body);
    res.send(item);
  };

  //delete a item
  deleteItem = async (req: Request, res: Response) => {
    const id = req.params.id;
    await itemService.deleteItem(id);
    res.send('item deleted');
  };

  createMissingRatings = async (req: Request, res: Response) => {
    let result = await placeItemService.createMissingRatings();
    result = await placeItemService.setNoOfReviewsToNoOfRatings();
    if(result){
      res.sendStatus(200);
    } else {
      res.sendStatus(500);
    }
  }
  setItemCategories= async (req: Request, res: Response) =>  {
	  const result = await placeItemService.setItemCategories();
    if(result){
      res.sendStatus(200);
    } else {
      res.sendStatus(500);
    }
  }
}


//export class
export const itemController = new ItemController();
