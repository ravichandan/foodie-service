import { ICitySuburb, Suburb } from '../entities/suburb';
import { Logger } from 'log4js';
import { getLogger } from '../utils/Utils';
import { IPlace } from '../entities/place';

const log: Logger = getLogger('suburb.service');

export class SuburbService {

  //add a suburb
  async addSuburb(data: ICitySuburb): Promise<ICitySuburb> {
    log.trace('Request received in addSuburb, data: ', data);
    try {
      data.createdAt = new Date();
      data.modifiedAt = new Date();
      const newSuburb: any = await Suburb.findOneAndUpdate(
        {name: data.name },
        // data,
        {
          "$addToSet": { "surroundingSuburbs": { "$each": data.surroundingSuburbs }},
          $set: { postcode: data.postcode, city: data.city, country: 'Australia' },
        },
      { upsert: true, new: true, setDefaultsOnInsert: true });
      log.debug('Suburb added successfully returning created object. newSuburb: ', newSuburb);
      return newSuburb;
    } catch (error) {
      log.error('Error while adding a suburb. Error: ', error);
      throw error;
    }
  }
  //add multiple suburbs
  async addMultipleSuburbs(suburbs: ICitySuburb[]): Promise<ICitySuburb | unknown> {
    log.trace('Request received in addMultipleSuburbs, suburbs.length: ', suburbs.length);
    try {
      // data.createdAt = new Date();
      // data.modifiedAt = new Date();
      const result = await Suburb.insertMany(suburbs);
      log.debug('Suburb added bulk wrote objects. result: ', result);
      return result;
    } catch (error) {
      log.error('Error while adding a suburb. Error: ', error);
      throw error;
    }
  }

  //get all suburbs
  async getSuburbs(args: { city : string, country?: string }): Promise<ICitySuburb[] | undefined> {
    log.debug('Received request to getSuburbs');
    try {
      const suburbs = await Suburb.find({city: args.city, country: args.country ?? 'Australia'});
      log.trace('Returning fetched suburbs');
      return suburbs;
    } catch (error) {
      log.error('Error while doing getSuburbs', error);
    }
  }

  //get all suburbs
  async getSuburbNames(args: { city : string, country?: string }): Promise<ICitySuburb[] | undefined> {
    log.debug('Received request to getSuburbs');
    try {
      const suburbs = await Suburb.find({city: args.city, country: args.country ?? 'Australia'}).select('-_id name postcode');
      log.trace('Returning fetched suburbs');
      return suburbs;
    } catch (error) {
      log.error('Error while doing getSuburbs', error);
    }
  }

  //get all suburbs
  async getSuburbsByNames(names: string[]): Promise<ICitySuburb[] | undefined> {
    log.debug('Received request to getSuburbsByNames');
    try {
      const suburbs = await Suburb.find({ name: { $in: names } });
      log.trace('Returning fetched suburbs');
      return suburbs;
    } catch (error) {
      log.error('Error while doing getSuburbsByNames', error);
    }
  }

  //get a single suburb
  async getSuburb(id: any): Promise<ICitySuburb | null> {
    if (!id) {
      log.error('Need id to query a Suburb document');
      throw new Error('Need id to query a Suburb document');
    }
    log.trace('suburb.service-> fetching suburb by id: ', id);
    try {
      let suburb: ICitySuburb | null;
      suburb = await Suburb.findById(id);
      log.trace('Found suburb: ', suburb);
      return suburb;
    } catch (error) {
      log.error('Error while fetching Suburb with id: ' + id, error);
      throw error;
    }
  }

  //update a suburb
  async updateSuburbByName(name: string, data: any): Promise<ICitySuburb | undefined> {
    log.debug('Received request to update a Suburb with name: ', name);
    try {
      //pass the id of the object you want to update
      //data is for the new body you are updating the old one with
      //new:true, so the dats being returned, is the update one
      log.trace('Updating a Suburb name: ' + name + ' with data: ', data);
      const suburbz = await Suburb.findOneAndUpdate({ name: name }, data, {
        new: true,
      });
      log.trace('In suburb.service, updateSuburbByName(), result: ', suburbz);

      return suburbz ?? undefined;
    } catch (error) {
      log.error('Error while updating Suburb with name: ' + name + '. Error: ', error);
    }
  }

  //update a suburb
  async updateSuburb(id: string, data: any): Promise<ICitySuburb | undefined> {
    log.debug('Received request to update a Suburb with id: ', id);
    try {
      //pass the id of the object you want to update
      //data is for the new body you are updating the old one with
      //new:true, so the dats being returned, is the update one
      log.trace('Updating a Suburb id: ' + id + ' with data: ', data);
      const suburbz = await Suburb.findByIdAndUpdate(id, data, {
        new: true,
      });
      log.trace('In suburb.service, updateSuburb(), result: ', suburbz);

      return suburbz ?? undefined;
    } catch (error) {
      log.error('Error while updating Suburb with id: ' + id + '. Error: ', error);
    }
  }

  //delete a suburb by using the find by id and delete
  async deleteSuburb(id: string): Promise<IPlace | undefined> {
    log.debug('Received request to delete a place with id: ', id);
    try {
      const suburb = await Suburb.findByIdAndDelete(id);
      if (!suburb) {
        log.trace('Delete failed, Suburb with id: ' + id + ' not found');
        return undefined;
      }
    } catch (error) {
      log.error('Error while deleting Suburb with id: ' + id + '. Error: ', error);
    }
  }
}

//export the class
export const suburbService = new SuburbService();