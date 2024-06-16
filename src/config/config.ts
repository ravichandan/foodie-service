//importing modules
import dotenv from 'dotenv';
import mongoose from 'mongoose';

export const config = {

	bucket_provider: 'R2',
	DB_CONNECTION_STR:'mongodb://127.0.0.1:27017/qa?retryWrites=true&w=majority&compressors=snappy',

}
//config connection
