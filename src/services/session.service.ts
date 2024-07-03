import { Logger } from 'log4js';
import { getLogger } from '../utils/Utils';
import { ISession, Session } from '../entities/session';
import { customerService } from './customer.service';
import { CustomerNotFoundError, HTTP400Error, HTTP404Error } from '../utils/error4xx';

const log: Logger = getLogger('session.service');

export class SessionService {

  async createSession(customerId: any, key: any) {
    log.trace('In createSession for customerId: %s, key: %s ', customerId, key);
    if (!key) {
      log.trace('token not found');
      throw new HTTP400Error('token not sent in the request, can\'t create session');
    }

    const customer = await customerService.getCustomer({id: customerId});
    if(!customer){
      log.error('Customer not found');
      throw new CustomerNotFoundError();
    }
    const data = {
      customer: customer.id,
      session_key: key,
      createdAt: new Date(),
      modifiedAt: new Date()
    }
    try {
      const newSession = await Session.create(data);
      log.debug('Session added successfully returning created object. newSession: ', newSession);
      return newSession;
    } catch (error) {
      log.error('Error while adding a session. Error: ', error);
      throw error;
    }
  }


  //get all medias
  async getSessionByCustomer(customerId: string): Promise<ISession[] | undefined> {
    log.debug('Received request to getSessionByCustomer');
    try {
      const sessions = await Session.find({customer: customerId});
      log.trace('Returning fetched sessions of customer');
      return sessions;
    } catch (error) {
      log.error('Error while doing getSessionByCustomer', error);
    }
  }

  //update a session
  async updateSession(customerId: string, key: string): Promise<ISession | undefined> {
    log.debug('Received request to update a Session with customerId: ', customerId);
    try {
      let session: any = await Session.find({customer: customerId});
      if(!session){
        const newSession = await this.createSession(customerId, key);
        return newSession;
      }
      session = await Session.findByIdAndUpdate(session._id, { session, session_key: key }, {
        new: true,
      });
      log.trace('In session.service, updateSession(), result: ', session);

      return session ?? undefined;
    } catch (error) {
      log.error('Error while updating Media with customerId: ' + customerId + '. Error: ', error);
      throw error;
    }
  }

  // delete a session by using the find by customerId and delete
  async deleteSessionByCustomer(customerId: string): Promise<ISession | undefined> {
    log.debug('Received request to delete a session with customerId: ', customerId);
    try {
      const media = await Session.deleteMany({ customer: customerId });
      if (!media) {
        log.trace('Delete failed, Session with customerId: ' + customerId + ' not found');
        return undefined;
      }
    } catch (error) {
      log.error('Error while deleting Session with customerId: ' + customerId + '. Error: ', error);
      throw error;
    }
  }
}

//export the class
export const sessionService = new SessionService();
