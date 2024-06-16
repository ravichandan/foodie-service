import * as path from 'path';
import { Request, Response } from 'express';
import multer from 'multer';

const uploadFilePath = path.resolve(__dirname, '../..', 'public/uploads');

const storageFile: multer.StorageEngine = multer.diskStorage({
	destination: uploadFilePath,
	filename(req: Express.Request, file: Express.Multer.File, fn: (error: Error | null, filename: string) => void): void {
		fn(null, `${Math.trunc(Math.random()*1000)}-${new Date().getTime().toString()}-${file.fieldname}${path.extname(file.originalname)}`);
	},
});

const uploadFile = multer({
	storage: storageFile,
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter(req, file, callback) {
		// console.log('uploaFile22222');
		// console.log('uploadFile22222 req.files: ', req.files);
		// console.log('uploadFile22222 req.body: ', req.body);
		const extension: boolean = ['.png', '.jpg', '.jpeg'].indexOf(path.extname(file.originalname).toLowerCase()) >= 0;
		const mimeType: boolean = ['image/png', 'image/jpg', 'image/jpeg'].indexOf(file.mimetype) >= 0;
		// console.log('uploadFile22222 file: ', file.originalname);
		// console.log('uploadFile22222 req.body: ', req.body);

		if (extension && mimeType) {
			return callback(null, true);
		}

		callback(new Error('Invalid file type. Only picture file on type PNG and JPEG/JPG are allowed!'));
	},
}).array('file', 3);

const handleSingleUploadFile = async (req: Request, res: Response): Promise<any> => {
	console.log('in handleSingleUploadFile');
	return new Promise((resolve, reject): void => {
		uploadFile(req, res, (error) => {
			// console.log('uploadFile error: ', error);
			// console.log('uploadFile req.files: ', req.files);
			// console.log('uploadFile req.body: ', req.body);
			// console.log('uploadFile res: ', res);
			if (error) {
				reject(error);
			}

			resolve({ files: req.files, body: req.body });
		});
	});
};

export { handleSingleUploadFile };
