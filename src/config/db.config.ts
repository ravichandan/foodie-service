//importing modules
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { config } from './config';

dotenv.config();

//details from the env
const username = process.env.username;
const password = process.env.password;
const dbName: string = 'Post';

//connection string to mongo atlas

const connectionString: string = process.env.DB_CONNECTION_STR || config.DB_CONNECTION_STR;
// const connectionString: string = `mongodb://127.0.0.1:27017/qa?retryWrites=true&w=majority&compressors=snappy`;

const options = {
  autoIndex: false, // Don't build indexes
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
};

//config connection
export const db = mongoose.connect(connectionString, options);
// .then((res) => {
// 	if (res) {
// 		console.log(`Database connection successfully to ${dbName}`);
// 	}
// })
// .catch((err) => {
// 	console.log(err);
// });
