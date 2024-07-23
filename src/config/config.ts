//importing modules
// import dotenv from 'dotenv';
// import mongoose from 'mongoose';

  // DB_CONNECTION_STR: 'mongodb://127.0.0.1:27017/qa?retryWrites=true&w=majority&compressors=snappy',
export const config = {
  bucket_provider: 'R2',
  DB_CONNECTION_STR:"mongodb+srv://admin:admin@cluster0.gaz0ywh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  appKey:"xhASmry6QFCsGLeavZANlpPgfEnjeNXzuzAf9IzdfM1v4JSd17yQ7NYA8jDFIngM",
  // appKey:"xpFn86p1T5TlEwaFOS3j18h203KUZc7RK3feeVoFqYOBDsLy3PyrVpvRaZX3wE8s",
  appId:"data-ttagxfs",
  appRegion:"ap-southeast-2",
  databaseName: "test",
  states_suburbs: [{
    state: "NSW",
    suburbs: ['The Ponds','Quakers Hill', 'Schofields','Parramatta', 'Harris Park', 'Box hill', 'Kellyville', 'Riverstone'],
    city: "Sydney"
  }],
  CUSTOMER_HEADER: 'CUSTOMER_ID'
};
//config connection
