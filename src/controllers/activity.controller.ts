//import modules
import { activityService } from '../services/activity.service';
import { Request, Response } from 'express';
import { Logger } from 'log4js';
import { getLogger } from '../utils/Utils';
import { IActivity } from '../entities/activity';
import { IReview } from '../entities/review';
// import { ActivityModel } from '../models/activityModel';

const log: Logger = getLogger('activity.controller');

class ActivityController {
  // middleware to add an activity
  addActivity = async (req: Request, res: Response) => {
    //data to be saved in database
    log.trace('Creating model object with given data');
    const data = {
      createdAt: new Date(),
      modifiedAt: new Date(),
      ...req.body,
    };

    //call the addActivity function in the service and pass the data from the request
    log.trace('Sending "add" request to activityService');
    const activity = await activityService.addActivity(data);
    res.status(201).send(activity);
  };

  addNewSpendActivity = (review: IReview, points: number) => {
    log.debug('Making a spend entry in the Activity');
    const activityData: IActivity = {
      customer: review.customer,
      review: review.id,
      pointsEarned: -points,
    } as IActivity;

    activityService
      .addActivity(activityData)
      .then((data) => log.debug('Successfully added, activity: ', data))
      .catch((err) => log.error('Error while adding activity. Error:: ', err))
      .finally(() => log.debug('In finally of addNewSpendActivity'));
  };

  addNewReviewActivity = (review: IReview, points: number) => {
    log.debug('Making an entry in the Activity');
    const activityData: IActivity = {
      customer: review.customer,
      review: review.id,
      pointsEarned: points,
    } as IActivity;

    activityService
      .addActivity(activityData)
      .then((data) => log.debug('Successfully added, activity: ', data))
      .catch((err) => log.error('Error while adding activity. Error:: ', err))
      .finally(() => log.debug('In finally of addNewReviewActivity'));
  };

  //get all activitys
  getActivitys = async (req: Request, res: Response) => {
    const customerId =
      req.header('customerId') ?? req.header('custId') ?? req.header('CUSTOMER_ID') ?? req.header('CUST_ID');

    if (!customerId) {
      res.sendStatus(404);
      return;
    }

    const activitys = await activityService.getActivities(customerId);
    res.send(activitys);
  };

  //get a single activity
  getAActivity = async (req: Request, res: Response) => {
    //get id from the parameter
    const id = req.params.id ?? req.params.activityId;
    if (!id) {
      res.sendStatus(404);
      return;
    }
    const activity = await activityService.getActivity(id);
    res.send(activity);
  };

  //update an activity
  updateActivity = async (req: Request, res: Response) => {
    const id = req.params.id ?? req.params.activityId;
    if (!id) {
      res.sendStatus(404);
      return;
    }
    const activity = await activityService.updateActivity(id, req.body);
    res.send(activity);
  };

  //delete an activity
  deleteActivity = async (req: Request, res: Response) => {
    const id = req.params.id ?? req.params.activityId;
    if (!id) {
      res.sendStatus(404);
      return;
    }
    await activityService.deleteActivity(id);
    res.status(204).send('activity deleted');
  };
}

//export class
export const activityController = new ActivityController();
