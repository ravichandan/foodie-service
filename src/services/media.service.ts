import { IMedia, Media } from '../entities/media';
import { Logger } from 'log4js';
import { getLogger } from '../utils/Utils';
import { IPlace } from '../entities/place';
import { ObjectId } from 'mongoose';
import { r2Provider } from '../bucketers/r2.provider';
import { Readable } from 'stream';

const log: Logger = getLogger('media.service');

export class MediaService {
  // async addMediaToR2(req: Request, res: Response) {
  async addMediaToR2(customerId: string, files: any) {
    log.trace('In addMediaNew');
    log.trace('req.files', files);
    if (!files) {
      return;
    }

    //working
    // fs.readFile("/Users/ravisithiraju/SandstoneProjects/config-db-abank/config/bankfast/webStatic/widgets/dashboardWidget/favicon.ico", async function(err, data) {
    // 	if (err) throw err;
    // 	console.log(data);
    // 	const buf = data;
    // 	const re = Readable.from(buf, { objectMode: false });
    // 	console.log('222 readableLength', re.readableLength);
    // 	console.log('222', Readable.from(buf));
    // 	const result = await r2Provider.uploadV3('def', re);
    // 	console.log('222 result ', result );
    // });

    // working ends;

    return await Promise.all(
      (files as any).map(async (file: Express.Multer.File) => {
        // Write your buffer
        const bufferStream = Readable.from(file.buffer);
        return await r2Provider.uploadFileForCustomer(customerId, bufferStream);
      }),
    );
  }

  async removeMediaFromR2(keys: string[]) {
    log.info('In removeMediaFromR2, ', keys);
    if (keys?.length<1) {
      return;
    }

    return await Promise.all(
      keys.filter(Boolean).map(async (key: string) => {
        // log.info('in key: ',key);
        return r2Provider.removeFile(key);
      }),
    );
  }

  //add a media
  async addMedia(data: IMedia): Promise<IMedia | unknown> {
    log.trace('Request received in addMedia, data: ', data);
    try {
      data.createdAt = new Date();
      data.modifiedAt = new Date();
      const newMedia = await Media.create(data);
      log.debug('Media added successfully returning created object. newMedia: ', newMedia);
      return newMedia;
    } catch (error) {
      log.error('Error while adding a media. Error: ', error);
      throw error;
    }
  }

  //get all medias
  async getMedias(): Promise<IMedia[] | undefined> {
    log.debug('Received request to getMedias');
    try {
      const medias = await Media.find({});
      log.trace('Returning fetched medias');
      return medias;
    } catch (error) {
      log.error('Error while doing getMedias', error);
    }
  }

  //get all medias
  async getMediasInIds(ids: ObjectId[]): Promise<IMedia[] | undefined> {
    log.debug('Received request to getMediasInIds');
    try {
      const medias = await Media.find({ _id: { $in: ids } });
      log.trace('Returning fetched medias');
      return medias;
    } catch (error) {
      log.error('Error while doing getMediasInIds', error);
    }
  }

  // {
  // 	'_id': { $in: [
  // 			mongoose.Types.ObjectId('4ed3ede8844f0f351100000c'),
  // 		mongoose.Types.ObjectId('4ed3f117a844e0471100000d'),
  // 		mongoose.Types.ObjectId('4ed3f18132f50c491100000e')
  // 		]}
  // }
  //get a single media
  async getMedia(query: { id?: any; correlationId?: string }): Promise<IMedia | null> {
    if (!query.id && !query.correlationId) {
      log.error('Need either id or correlationId to query a Media document');
      throw new Error('Need either id or correlationId to query a Media document');
    }
    try {
      let media: IMedia | null;
      if (query.id) {
        media = await Media.findById(query.id);
      } else {
        media = await Media.findOne({ correlationId: query.correlationId });
      }
      log.trace('Found media with query', query);
      return media;
    } catch (error) {
      log.error('Error while fetching Media with id: ' + query.id + ', correlationId: ' + query.correlationId, error);
      throw error;
    }
  }

  //update a media
  async updateMedia(id: any, data: any): Promise<IMedia | undefined> {
    log.debug('Received request to update a Media with id: ', id);
    try {
      //pass the id of the object you want to update
      //data is for the new body you are updating the old one with
      //new:true, so the dats being returned, is the update one
      log.trace('Updating a Media id: ' + id + ' with data: ', data);
      const mediaz = await Media.findByIdAndUpdate(id, data, {
        new: true,
      });
      log.trace('In media.service, updateMedia(), result: ', mediaz);

      return mediaz ?? undefined;
    } catch (error) {
      log.error('Error while updating Media with id: ' + id + '. Error: ', error);
    }
  }

  //delete a media by using the find by id and delete
  async deleteMedia(id: string): Promise<IPlace | undefined> {
    log.debug('Received request to delete a place with id: ', id);
    try {
      const media = await Media.findByIdAndDelete(id);
      if (!media) {
        log.trace('Delete failed, Media with id: ' + id + ' not found');
        return undefined;
      }
    } catch (error) {
      log.error('Error while deleting Media with id: ' + id + '. Error: ', error);
    }
  }
}

//export the class
export const mediaService = new MediaService();
