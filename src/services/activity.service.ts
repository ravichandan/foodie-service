import { Logger } from 'log4js';
import { getLogger } from '../utils/Utils';
import { IPlace } from '../entities/place';
import { ObjectId } from 'mongoose';
import { Activity, IActivity } from '../entities/activity';

const log: Logger = getLogger('activity.service');

export class ActivityService {
	//add an activity
	async addActivity(data: IActivity): Promise<IActivity | unknown> {
		log.trace('Request received in addActivity, data: ', data);
		try {
			data.createdAt = new Date();
			data.modifiedAt = new Date();
			const newActivity = await Activity.create(data);
			log.debug('Activity added successfully returning created object. newActivity: ', newActivity);
			return newActivity;
		} catch (error) {
			log.error('Error while adding a activity. Error: ', error);
			return error;
		}
	}

	//get all activities of a customer
	async getActivities(customerId: string): Promise<IActivity[] | undefined> {
		log.debug('Received request to getActivities');
		try {
			const activities = await Activity.find({customer: customerId});
			log.trace('Returning fetched activities');
			return activities;
		} catch (error) {
			log.error('Error while doing getActivities', error);
		}
	}

	//get a single Activity
	async getActivity( id: string): Promise<IActivity | null> {
		try {
			let activity: IActivity | null;
			activity = await Activity.findById(id);
			log.trace('Found activity with id', id);
			return activity;
		} catch (error) {
			log.error('Error while fetching Activity with id: ' + id, error);
			throw error;
		}
	}

	//update a Activity
	async updateActivity(id: string, data: any): Promise<IActivity | undefined> {
		log.debug('Received request to update a Activity with id: ', id);
		try {
			//pass the id of the object you want to update
			//data is for the new body you are updating the old one with
			//new:true, so the dats being returned, is the update one
			log.trace('Updating a IActivity id: ' + id + ' with data: ', data);
			const activiti = await Activity.findByIdAndUpdate(id, data, {
				new: true,
			});
			log.trace('In activity.service, updateActivity(), result: ', activiti);

			return activiti ?? undefined;
		} catch (error) {
			log.error('Error while updating Activity with id: ' + id + '. Error: ', error);
		}
	}

	//delete a Activity by using the find by id and delete
	async deleteActivity(id: string): Promise<IActivity | undefined> {
		log.debug('Received request to delete a Activity with id: ', id);
		try {
			const activity = await Activity.findByIdAndDelete(id);
			if (!activity) {
				log.trace('Delete failed, Activity with id: ' + id + ' not found');
				return undefined;
			}
		} catch (error) {
			log.error('Error while deleting Activity with id: ' + id + '. Error: ', error);
		}
	}
}

//export the class
export const activityService = new ActivityService();
