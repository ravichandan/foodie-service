//import modules
import { suburbService } from '../services/suburb.service';
import { Request, Response } from 'express';
import { Logger } from 'log4js';
import { getLogger } from '../utils/Utils';
import { ICitySuburb } from '../entities/suburb';

const log: Logger = getLogger('suburb.controller');

class SuburbController {

	// middleware to add a suburb
	addMultipleSuburbs = async (requestBody: any) => {

		log.trace('suburb.controller->addMultipleSuburbs, requestBody: ', requestBody);
		// iterate the request body object
		const body = requestBody;
		const keys = Object.keys(body);
		const suburbs: ICitySuburb[] = keys.map(key => ({
			name: key,
			postcode: body[key].Postcode,
			state: body[key].State,
			city: body[key].City,
			country: body[key].Country,
			surroundingSuburbs: body[key]['Surrounding Suburbs'],
		} as ICitySuburb));

		const errored: ICitySuburb[]=[];
		for (const suburb of suburbs) {
			log.trace('suburb.controller -> addMultipleSuburbs, saving:: ', suburb.name);
			let result: ICitySuburb;
			try {
				result = await suburbService.addSuburb(suburb);
				log.trace('Saved suburb successfully, result:: ', result.name);
			} catch (err) {
				log.error('Error while adding the suburb', suburb, err);
				errored.push(suburb);
			}
		}
		return errored;
		//data to be saved in database

		//call the addSuburb function in the service and pass the data from the request
		// return result;
		// res.status(201).send(result);
		// }
	};


	//get all suburbs
	async getSuburbsByNames(names: string[]): Promise<ICitySuburb[] | undefined> {
		log.trace('suburb.controller-> received request to getSuburbsByNames');
		try {
			const suburbs = await suburbService.getSuburbsByNames(names);
			log.trace('Returning fetched suburbs');
			return suburbs;
		} catch (error) {
			log.error('Error while doing getSuburbsByNames', error);
		}
	}

	//get a single suburb
	getASuburb = async (req: Request, res: Response) => {
		//get id from the parameter
		const id = +req.params.id;
		const suburb = await suburbService.getSuburb({ id: id });
		res.send(suburb);
	};

	//get all suburbs of a city
	getSuburbs = async (args: { city : string, country?: string }) => {
		//get id from the parameter
		const suburbs = await suburbService.getSuburbNames(args);
		return suburbs;
	};

	async getSuburbNameFromLocationIQ(req: Request, res: Response): Promise<string|undefined> {
		const {latitude, longitude} ={...req.query} as any;
		if(!latitude || !longitude){
			res.status(400).send('latitude and longitude are mandatory for this request');
			return;
		}
		const suburbName = await suburbService.getSuburbNameFromLocationIQ(+latitude, +longitude);
		res.send({name: suburbName});
	}

	//update suburb
	updateSuburb = async (req: Request, res: Response) => {
		const id: string = req.params.id;
		const suburb = await suburbService.updateSuburb(id, req.body);
		res.send(suburb);
	};

	//update suburb
	updateSuburbByName = async (name: string, data: any) => {
		const suburb = await suburbService.updateSuburbByName(name, data);
		return suburb;
	};

	//delete a suburb
	deleteSuburb = async (req: Request, res: Response) => {
		const id = req.params.id;
		await suburbService.deleteSuburb(id);
		res.status(204).send('suburb deleted');
	};
}

//export class
export const suburbController = new SuburbController();
