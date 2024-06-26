import { itemService } from '../services/item.service';
import { Request, Response } from 'express';
import { Cuisine, IItem, ItemCategory } from '../entities/item';
import { mediaService } from '../services/media.service';
import { IMedia } from '../entities/media';
import { getLogger } from '../utils/Utils';
import { Logger } from 'log4js';
import { IPlaceItem } from '../entities/placeItem';
import { placeService } from '../services/place.service';
import { IPlace } from '../entities/place';
import { placeItemService } from '../services/placeItem.service';

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
      category: ItemCategory[req.body.category.toUpperCase() as ItemCategory],
      cuisines: [...req.body.cuisines.map((c: any) => Cuisine[c.toUpperCase() as Cuisine])],
    };
    //call the create item function in the service and pass the data from the request
    try {
      log.trace('Creating a Item with given data: ', data);
      const item: IItem | null | undefined = await itemService.createItem(data);
      log.trace('Fetching Media document with correlationId: ', item.correlationId);
      const media: IMedia | null = item.media ? await mediaService.getMedia({ id: item.media?.id }) : null;
      !!media && (media.item = item.id) && media?.save();

      if (!item) {
        log.info('Item not created due to previous errors, returning 404');
        res.status(404).send('Item not found');
      } else {
        log.info('Item created successfully, returning the new object');
        res.status(201).send(item);
      }
    } catch (error: any) {
      log.error('Error while creating item with given data. Error: ', error);
      res.send(error.message);
    }
  };

  //get all items
  getItems = async (req: Request, res: Response) => {
    const items = await itemService.getItems();
    res.send(items);
  };

  //get a single item
  getAItem = async (req: Request, res: Response) => {
    //get id from the parameter
    // TODO take pagination params and return the data accordingly.
    const id = req.params.id;
    const item = await itemService.getItem(id);
    res.send(item);
  };

  //get a single item
  getAItemInAPlace = async (args : {placeId: string, itemId: string}) => {
    //get id from the parameter
    // TODO take pagination params and return the data accordingly.
    const { placeId, itemId } = { ...args };
    try {
      const item = await itemService.getAPlaceItem({ placeId, itemId });
      return item;
      // res.send(item);
    } catch (error: any) {
      throw error;
      // res.status(500).send(error);
    }
  };

  //update item
  updateItem = async (req: Request, res: Response) => {
    const id = +req.params.id;
    const item = await itemService.updateItem(id, req.body);
    res.send(item);
  };

  //delete a item
  deleteItem = async (req: Request, res: Response) => {
    const id = req.params.id;
    await itemService.deleteItem(id);
    res.send('item deleted');
  };
}

//export class
export const itemController = new ItemController();
