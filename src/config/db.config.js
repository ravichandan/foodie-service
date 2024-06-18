'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.db = void 0;
//importing modules
const dotenv_1 = __importDefault(require('dotenv'));
const mongoose_1 = __importDefault(require('mongoose'));
dotenv_1.default.config();
//details from the env
const username = process.env.username;
const password = process.env.password;
const dbName = 'Post';
//connection string to mongo atlas
const connectionString = `mongodb://127.0.0.1:27017/qa?retryWrites=true&w=majority`;
const options = {
  autoIndex: false, // Don't build indexes
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
};
//config connection
exports.db = mongoose_1.default
  .connect(connectionString, options)
  .then((res) => {
    if (res) {
      console.log(`Database connection successfully to ${dbName}`);
    }
  })
  .catch((err) => {
    console.log(err);
  });
//# sourceMappingURL=db.config.js.map
