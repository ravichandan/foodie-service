import { IItem, Item } from '../entities/item';
import { Logger } from 'log4js';
import { getLogger } from '../utils/Utils';
import { IPlaceItem, PlaceItem } from '../entities/placeItem';
import { Query } from 'mongoose';

const log: Logger = getLogger('item.service');

export class ItemService {
	//create an item
	async createItem(itemData: IItem): Promise<IItem> {
		log.debug('In Item.Service-> createItem(), received request to create a Item');
		try{
			log.debug('In Item.Service-> createItem(), check if the item already exists in the inventory')
			const existing = await Item.findOne({ name: itemData.name, cuisines: itemData.cuisines  });
			if(existing){
				log.trace('Item with name and cuisine(s) already exists, returning it. item: ', existing);
				return existing;
			}
		}catch(error){
			log.error('Error while looking if an item exists with given name and cuisine. Will log the error and proceed with creating a new entry, Error: ', error);
			// throw error;
		}

		try {
			itemData.createdAt = new Date();
			itemData.modifiedAt = new Date();
			log.trace('Creating Item with data: ', itemData);
			const newItem: IItem = await Item.create(itemData);
			log.trace('Item created successfully, returning data');
			return newItem;
		} catch (error) {
			log.error('Error while create a Item: ', error);
			throw error;
		}
	}

	//get all items
	async getItems(): Promise<IItem[] | undefined> {
		log.debug('Received request to getItems');
		try {
			const items = await Item.find({});
			log.trace('Returning fetched items');
			return items;
		} catch (error) {
			log.error('Error while doing getItems', error);
		}
	}

	//get a single item
	async getItem(id: string): Promise<IItem | undefined> {
		log.debug('Received request to get a item with id: ', id);
		try {
			const item = await Item.findById({ _id: id });
			if (!item) {
				log.trace('Item not found for id: ', id);
				return undefined;
			}
			log.trace('Fetched a Item id: ' + id + '. item: ', item);
			return item;
		} catch (error) {
			log.error('Error while doing getItem with id: ' + id + '. Error: ', error);
		}
	}

	//get a single item
	async getAPlaceItem(params: { placeId:string, itemId: string }): Promise<IPlaceItem | undefined> {
		log.debug('Received request to get a item with params: ', params);
		try {
			const item = await PlaceItem
				.findOne({ place: { _id:params.placeId }, item:{_id:params.itemId} })
				.populate({ path: 'reviews ratings medias', options: { sort: { 'createdAt': -1 }, limit: 20 } },);
			if (!item) {
				log.trace('Item not found for params: ', params);
				return undefined;
			}
			log.trace('Fetched a Item params: ' + params + '. item: ', item);
			return item;
		} catch (error) {
			log.error('Error while doing getItem with params: ' + params + '. Error: ', error);
			 throw error;
		}
	}

	//update a item
	async updateItem(id: number, data: any): Promise<IItem | null | undefined> {
		log.debug('Received request to update a item with id: ', id);

		try {
			//pass the id of the object you want to update
			//data is for the new body you are updating the old one with
			//new:true, so the dats being returned, is the update one
			log.trace('Updating a item id: ' + id + ' with data: ', data);
			const itemz = await Item.findByIdAndUpdate({ _id: id }, data, {
				new: true,
			});
			log.debug('Successfully updated the Item: ', itemz);
			return itemz;
		} catch (error) {
			log.error('Error while updating Item with id: ' + id + '. Error: ', error);
		}
	}

	//delete a item by using the find by id and delete
	async deleteItem(id: string): Promise<IItem | undefined> {
		log.debug('Received request to delete a item with id: ', id);

		try {
			const item = await Item.findByIdAndDelete(id);
			if (!item) {
				log.trace('Delete failed, Item with id: ' + id + ' not found');
				return undefined;
			}
			log.trace('Item with id: ' + id + ' deleted successfully');
			return item;
		} catch (error) {
			log.error('Error while deleting Item with id: ' + id + '. Error: ', error);
		}
	}
}

//export the class
export const itemService = new ItemService();
