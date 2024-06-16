import * as path from 'path';
import { Request, Response } from 'express';
import multer from 'multer';
import util from 'util';


// define storage
let memoryStorage = multer.memoryStorage();

let uploadMultipleFiles = multer({
	storage: memoryStorage
}).array("files")

uploadMultipleFiles = util.promisify(uploadMultipleFiles);

// module.exports = { uploadMultipleFiles };


const createFileBuffer = async (req: Request, res: Response): Promise<any> => {
	console.log('in createFileBuffer');
	return new Promise((resolve, reject): void => {
		uploadMultipleFiles(req, res, (error) => {
			// console.log('uploadMultipleFiles error: ', error);
			// console.log('uploadMultipleFiles req.files: ', req.files);
			// console.log('uploadMultipleFiles req.body: ', req.body);
			// console.log('uploadMultipleFiles res: ', res);
			if (error) {
				reject(error);
			}

			resolve({ files: req.files, body: req.body });
		});
	});
};
export { createFileBuffer };
