import { IPlaceItem, PlaceItem } from '../entities/placeItem';
import { Logger } from 'log4js';
import { getLogger } from '../utils/Utils';
import { IPlace } from '../entities/place';
import { IPlaceItemRating } from '../entities/placeItemRating';

const log: Logger = getLogger('placeItem.service');

export class PlaceItemService {
  //create a placeItem
  async addPlaceItem(data: IPlaceItem): Promise<IPlaceItem> {
    log.debug('Received request to create a PlaceItem');
    try {
      data.createdAt = new Date();
      data.modifiedAt = new Date();
      log.trace('Creating PlaceItem with data: ', data);
      const newItem: IPlaceItem = await PlaceItem.create(data);
      log.trace('PlaceItem created successfully, returning data');
      return newItem;
    } catch (error) {
      log.error('Error while create a PlaceItem: ', error);
      throw error;
    }
  }

  //get all PlaceItems
  // not yet used
  async getPlaceItems(): Promise<IPlaceItem[] | undefined> {
    log.debug('Received request to getPlaceItems');
    try {
      const items = await PlaceItem.find({});
      log.trace('Returning fetched items');
      return items;
    } catch (error) {
      log.error('Error while doing getPlaceItems', error);
    }
  }

  //get all placeItems of given place
  // not yet used
  async getPlaceItemsByPlace(place: IPlace): Promise<IPlaceItem[] | undefined | any> {
    log.info('Received request to getPlaceItems by given Place. place: ', place);
    try {
      const items: IPlaceItem[] = await PlaceItem.find({ place: { _id: place._id } })
        .populate('place')
        .populate('item');
      log.trace('Returning fetched items, items: ', items);
      return items;
    } catch (error) {
      log.error('Error while doing getPlaceItems', error);
    }
  }

  //get a single placeItem
  // not yet used
  async getPlaceItem(id: string): Promise<IPlaceItem | undefined> {
    log.debug('Received request to get a placeItem with id: ', id);
    try {
      const placeItem = await PlaceItem.findById({ _id: id });
      if (!placeItem) {
        log.trace('PlaceItem not found for id: ', id);
        return undefined;
      }
      log.trace('Fetched a PlaceItem id: ' + id + '. placeItem: ', placeItem);
      return placeItem;
    } catch (error) {
      log.error('Error while doing getPlaceItem with id: ' + id + '. Error: ', error);
    }
  }

  //update a placeItem
  // not yet used
  async updatePlaceItem(id: number, data: any): Promise<IPlaceItem | null | undefined> {
    log.debug('Received request to update a placeItem with id: ', id);

    try {
      //pass the id of the object you want to update
      //data is for the new body you are updating the old one with
      //new:true, so the dats being returned, is the update one
      log.trace('Updating a placeItem id: ' + id + ' with data: ', data);
      const itemz = await PlaceItem.findByIdAndUpdate({ _id: id }, data, {
        new: true,
      });
      log.debug('Successfully updated the PlaceItem: ', itemz);
      return itemz;
    } catch (error) {
      log.error('Error while updating PlaceItem with id: ' + id + '. Error: ', error);
    }
  }

  //delete a placeItem by using the find by id and delete
  // not yet used
  async deletePlaceItem(id: string): Promise<IPlaceItem | undefined> {
    log.debug('Received request to delete a placeItem with id: ', id);

    try {
      const placeItem = await PlaceItem.findByIdAndDelete(id);
      if (!placeItem) {
        log.trace('Delete failed, PlaceItem with id: ' + id + ' not found');
        return undefined;
      }
      log.trace('PlaceItem with id: ' + id + ' deleted successfully');
      return placeItem;
    } catch (error) {
      log.error('Error while deleting PlaceItem with id: ' + id + '. Error: ', error);
    }
  }
}

//export the class
export const placeItemService = new PlaceItemService();
