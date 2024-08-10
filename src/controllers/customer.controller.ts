//import modules
import { customerService } from '../services/customer.service';
import { Request, Response } from 'express';
import { ICustomer, Customer } from '../entities/customer';
import { mediaService } from '../services/media.service';
import { IMedia } from '../entities/media';
import * as Utils from '../utils/Utils';
import { Logger } from 'log4js';
import { CustomerResponse } from '../models/customerModel';
import { Readable } from 'stream';
import { ActivityLevel } from '../entities/activity';
import { mediaController } from './media.controller';
import { sessionService } from '../services/session.service';


const log: Logger = Utils.getLogger('customer.controller');

class CustomerController {
  //add customer controller
  addCustomer = async (req: Request, res: Response) => {
    //data to be saved in database
    log.trace('Adding correlationId into the request body');
    const data: ICustomer = {
      correlationId: req.header('correlationId'),
      ...req.body,
    };
    data.picture = data.correlationId ? (undefined as any) : data.picture;

    //call the create customer function in the service and pass the data from the request
    try {
      log.trace('Creating a Customer with given data');
      let customer: ICustomer | null | undefined = await customerService.createCustomer(data);
      if (customer && data.correlationId) {
        try {
          // update Media document if it exists.
          log.trace('Fetching Media document with correlationId: ', customer.correlationId);
          const media: IMedia | null = await mediaService.getMedia({
            correlationId: data.correlationId,
          });
          if (media) {
            log.trace(
              'Fetched Media document with correlationId: %s, media -> _id: %s',
              customer.correlationId,
              media?._id,
            );
            log.trace(
              'Adding customerId and customerId to Media document with _id: %s',
              customer.correlationId,
              media?._id,
            );
            await mediaService.updateMedia(media._id, {
              customerId: customer._id,
            });
            log.trace('Updating Customer document with _id: %s to add to media', customer._id);
            customer = await customerService.updateCustomerPicture(customer._id, media);
          } else {
            log.error("Couldn't find any media with this correlationId: ", customer.correlationId);
          }
        } catch (error: any) {
          log.error('Error while updating Media document with Customer id: ' + customer?._id, error);
        }
      }
      if (!customer) {
        log.info('Customer not created due to previous errors, returning 404');
        res.status(404).send('Customer could not be added');
      } else {
        log.info('Customer created successfully, returning the new object');
        res.status(201).send(customer);
      }
    } catch (error: any) {
      log.error('Error while creating customer with given data. Error: ', error);
      res.send(error.message);
    }
  };

  /**
   * API Controller method for 'get customers by name'. This takes at-least customerName and returns 10 results
   */
  getCustomersByName = async (req: Request, res: Response) => {
    log.info('Received request in getCustomers');
    const { customerName }: { customerName: string } = {
      ...req.params,
      ...req.query,
    } as any;

    log.trace('Params to getCustomers: ', { customerName });
    const customers: ICustomer[] | undefined = await customerService.getCustomers({ customerName });
    log.trace('Found the following customers with given params', customers);
    if (!customers) {
      res.status(404).send('No customers found with given criteria');
      return;
    }
    if (customers.length > 2) {
      const customerResponse: CustomerResponse = {
        customers: Utils.customersToCustomerModels(customers),
        size: customers.length,
        page: 1,
      };
      res.send(customerResponse); // TODO
      return;
    }

    log.trace('Only one customer found with given criteria, loading its liked & reviews');
    await Customer.populate(customers, [{ path: 'reviews liked', options: { sort: { createdAt: -1 }, limit: 10 } }]);

    log.trace('Loaded all properties for the customer, ', customers);

    const customerResponse: CustomerResponse = {
      customers: Utils.customersToCustomerModels(customers),
      size: 1,
      page: 1,
    };
    console.log('customerResponse:: ', customerResponse);
    res.send(customerResponse);
  };

  //get a single customer
  getACustomerByIdOrEmail = async (args: { id?: string, email?: string }) => {
    //get id from the parameter
    // const id = req.params.id;
    const customer = await customerService.getCustomer(args);
    if (!customer) {
      const customerResponse: CustomerResponse = {
        customers: [],
        size: 0,
        page: 1,
      };
      // res.send(customerResponse);
      return customerResponse;
    }
    await Customer.populate(customer, [{ path: 'reviews liked', options: { sort: { createdAt: -1 }, limit: 10 } }]);
    log.trace('Loaded all properties for the customer, ', customer);

    const customerResponse: CustomerResponse = {
      customers: [Utils.customerToCustomerModel(customer!)],
      size: 1,
      page: 1,
    };
    return customerResponse;
    // res.send(customerResponse);
  };

  //update customer
  updateCustomer = async (req: Request, res: Response) => {
    const id = +req.params.id;
    const customer = await customerService.updateCustomer(id, req.body);
    const customerResponse: CustomerResponse = {
      customers: [Utils.customerToCustomerModel(customer!)],
      size: 1,
      page: 1,
    };
    res.send(customerResponse);
  };

  //delete a customer
  deleteCustomer = async (req: Request, res: Response) => {
    const id = req.params.id;
    await customerService.deleteCustomer(id);
    res.send('customer deleted');
  };

  async loginCustomer(req: Request, res: Response) {
    log.trace('in customer.controller, got request to login a oauth customer, requestBody:: ', req.body);
    const payload = req.body.userInfo.info;

    let customer: ICustomer | undefined = await customerService.getCustomer({email: payload.email});
    if(!customer){
      log.trace('Customer not found with given args, registering customer for the first time');

      // Step 1: save the customer and generate an id for it.
      const data={
        name: payload.given_name + ' '+ payload.family_name,
        email: payload.email,
        level: ActivityLevel.STARTER,
        status: 'verified'
      } as ICustomer;
      log.trace('Saving basic customer details');
      customer = await customerService.createCustomer(data);
      log.trace('customer created, ', customer);
      if(!!customer) {
        // Step 2: upload profile picture into storage
        const picUrl = payload.picture;
        if (!!picUrl) {
          // first create stream from the url
          const picturePromise = fetch(picUrl)
            .then(r => Readable.fromWeb(r.body as any))
            .then(readable => mediaService.addMediaToR2(customer?.id, [readable]))
            .then(files => files && mediaController.addMultipleMedias(undefined, files))
            .then(medias => !!(medias?.[0]) ? customerService.updateCustomerPicture(customer?.id, medias[0] as IMedia): undefined);
          // picturePromise.then();
          await picturePromise;
        }
      }

      const token = req.body.userInfo.token;
      const sess = await sessionService.createSession(customer._id as string, token);
      log.trace('Session created:: ', sess);
      return res.status(201).send(customer);
    }

    const token = req.body.userInfo.token;
    await sessionService.createSession(customer, token);
    log.trace('in customer.controller, created session, returning.');
    return res.status(200).send(customer);
  }
}

//export class
export const customerController = new CustomerController();
