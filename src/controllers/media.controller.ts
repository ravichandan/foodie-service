//import modules
import { mediaService } from '../services/media.service';
import { Request, Response } from 'express';
import { Logger } from 'log4js';
import { getLogger } from '../utils/Utils';
import { placeService } from '../services/place.service';
import { IMedia } from '../entities/media';
import { UploadedFile } from '../routes/service.routes';
import { CustomerIdHeaderNotFoundError } from '../utils/error4xx';
import { config } from '../config/config';
import { createFileBuffer } from '../utils/MemoryFileStorage';
import { handleSingleUploadFile } from '../utils/LocalFileStorage';
import { placeItemService } from '../services/placeItem.service';

const log: Logger = getLogger('media.controller');

class MediaController {
  uploadMultipleMedias = async (req: Request, res: Response) => {
    log.info('media.controller->uploadMultipleMedias');
    const customerId =
      req.header('customerId') ?? req.header('custId') ?? req.header('CUSTOMER_ID') ?? req.header('CUST_ID');
    if (!customerId) {
      log.error('customerId header is not found in the request, throwing error');
      throw new CustomerIdHeaderNotFoundError();
    }

    //call the addMedia function in the service and pass the data from the request
    log.trace(`bucket_provider is ${config.bucket_provider}`);
    let result;
    if (config.bucket_provider === 'R2') {
      log.trace('Creating file buffers');
      await createFileBuffer(req, res);
      log.trace('Upload to R2 bucket');
      result = await mediaService.addMediaToR2(customerId, req.files);
    } else {
      log.trace('Uploading file to local file storage');
      result = await handleSingleUploadFile(req, res);
    }

    log.trace('In media.controller-> uploadMultipleMedias(), result:: ', result);

    // res.status(201).send(result);
    return result;
  };

  removeUploadedMedias = async (keys: string[]) => {
    log.info('media.controller->removeUploadedMedias');
    // [{ key: req.params.key}]
    if (config.bucket_provider === 'R2') {
      log.trace('Removing files in R2 file buffers');
      await mediaService.removeMediaFromR2(keys);
    } else {
      log.trace('Removing files in local file storage');
      // result = await handleSingleUploadFile(req, res);
      // TODO
    }
  };
  // middleware to add a media
  addMultipleMedias = async (body: any, files: any[]) => {
    //data to be saved in database
    log.debug('In media.controller -> addMultipleMedias()');
    // uploadedResult.
    const medias = [];
    for (const file of files) {
      const data = {
        url: file.Location,
        key: file.Key,
        createdAt: new Date(),
        modifiedAt: new Date(),
         ...(body),
      };

      //call the addMedia function in the service and pass the data from the request
      log.trace('Sending "add" request to mediaService');
      const media: IMedia | unknown = await mediaService.addMedia(data);
      if (data.placeId && !!media) {
        const place = await placeService.updatePlaceMedias(data.placeId, media as IMedia);
      }
      if (data.placeItemId && !!media) {
        const placeItem = await placeItemService.updatePlaceItemMedias(data.placeItemId, media as IMedia);
      }
      media && medias.push(media);
    }

    // res.status(201).send(medias);
    return medias;
    // }
  };
  // middleware to add a media
  addMedia = async (req: Request, res: Response, uploadedFilePath: string) => {
    // check('name').isLength({ min: 3 }).trim().escape(),
    //     check('email').isEmail().normalizeEmail(),
    //     check('age').isNumeric().trim().escape()

    //data to be saved in database
    log.trace('Creating model object with given data');
    const data = {
      url: uploadedFilePath,
      createdAt: new Date(),
      modifiedAt: new Date(),
      ...req.body,
    };

    //call the addMedia function in the service and pass the data from the request
    log.trace('Sending "add" request to mediaService');
    const media = await mediaService.addMedia(data);
    if (data.placeId && !!media) {
      const place = await placeService.updatePlaceMedias(data.placeId, media as IMedia);
    }
    res.status(201).send(media);
    // }
  };

  //get all medias
  getMedias = async (req: Request, res: Response) => {
    const medias = await mediaService.getMedias();
    res.send(medias);
  };

  //get a single media
  getAMedia = async (req: Request, res: Response) => {
    //get id from the parameter
    const id = +req.params.id;
    const media = await mediaService.getMedia({ id: id });
    res.send(media);
  };

  //update media
  updateMedia = async (req: Request, res: Response) => {
    const id = +req.params.id;
    const media = await mediaService.updateMedia(id, req.body);
    res.send(media);
  };

  //delete a media
  deleteMedia = async (req: Request, res: Response) => {
    const id = req.params.id;
    await mediaService.deleteMedia(id);
    res.status(204).send('media deleted');
  };
}

//export class
export const mediaController = new MediaController();
