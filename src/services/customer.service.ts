import { ICustomer, Customer } from '../entities/customer';
import { Logger } from 'log4js';
import { getLogger } from '../utils/Utils';
import { IMedia } from '../entities/media';
import { IPlace, Place } from '../entities/place';

const log: Logger = getLogger('customer.service');

export class CustomerService {
  //create a customer
  async createCustomer(customerData: ICustomer): Promise<ICustomer> {
    log.debug('Received request to create a Customer');
    try {
      customerData.createdAt = new Date();
      customerData.modifiedAt = new Date();
      log.trace('Creating Customer with data: ', customerData);
      const newCustomer: ICustomer = await Customer.create(customerData);
      log.trace('Customer created successfully, returning data');
      return newCustomer;
    } catch (error) {
      log.error('Error while create a Customer: ', error);
      throw error;
    }
  }

  //update a place
  async updateCustomerPicture(id: any, media: IMedia): Promise<ICustomer | null | undefined> {
    log.debug('Received request to add picture to a customer with id: ', id);

    try {
      //pass the id of the object you want to update
      //data is for the new body you are updating the old one with
      //new:true, so the dats being returned, is the update one
      log.trace('Updating a place id: ' + id + ' with media: ', media);
      const cust: any = await Customer.findByIdAndUpdate(
        { _id: id },
        { picture: media },
        {
          new: true,
        },
      );
      log.debug('Successfully updated the Customer: ', cust);
      return cust;
    } catch (error) {
      log.error('Error while updating Customer with id: ' + id + '. Error: ', error);
      throw error;
    }
  }

  //get all customers
  async getCustomers(params: { customerName: string }): Promise<ICustomer[] | undefined> {
    log.debug('Received request to getCustomers');
    try {
      const customers = await Customer.find({ name: params.customerName });
      log.trace('Returning fetched customers');
      return customers;
    } catch (error) {
      log.error('Error while doing getCustomers', error);
    }
  }

  //get a single customer
  async getCustomer(id: string): Promise<ICustomer | undefined> {
    log.debug('Received request to get a customer with id: ', id);
    try {
      const customer = await Customer.findById({ _id: id });
      if (!customer) {
        log.trace('Customer not found for id: ', id);
        return undefined;
      }
      log.trace('Fetched a Customer id: ' + id + '. customer: ', customer);
      return customer;
    } catch (error) {
      log.error('Error while doing getCustomer with id: ' + id + '. Error: ', error);
    }
  }

  //update a customer
  async updateCustomer(id: number, data: any): Promise<ICustomer | null | undefined> {
    log.debug('Received request to update a customer with id: ', id);

    try {
      //pass the id of the object you want to update
      //data is for the new body you are updating the old one with
      //new:true, so the dats being returned, is the update one
      log.trace('Updating a customer id: ' + id + ' with data: ', data);
      const customerz = await Customer.findByIdAndUpdate({ _id: id }, data, {
        new: true,
      }).populate([{ path: 'reviews liked', options: { sort: { createdAt: -1 }, limit: 10 } }]);
      log.debug('Successfully updated the Customer: ', customerz);
      return customerz;
    } catch (error) {
      log.error('Error while updating Customer with id: ' + id + '. Error: ', error);
    }
  }

  //delete a customer by using the find by id and delete
  async deleteCustomer(id: string): Promise<ICustomer | undefined> {
    log.debug('Received request to delete a customer with id: ', id);

    try {
      const customer = await Customer.findByIdAndDelete(id);
      if (!customer) {
        log.trace('Delete failed, Customer with id: ' + id + ' not found');
        return undefined;
      }
      log.trace('Customer with id: ' + id + ' deleted successfully');
      return customer;
    } catch (error) {
      log.error('Error while deleting Customer with id: ' + id + '. Error: ', error);
    }
  }
}

//export the class
export const customerService = new CustomerService();
