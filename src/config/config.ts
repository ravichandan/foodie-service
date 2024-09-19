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
  databaseName: "qa",
  states_suburbs: [{
    state: "NSW",
    suburbs: ['The Ponds','Quakers Hill', 'Schofields','Parramatta', 'Harris Park', 'Box hill', 'Kellyville', 'Riverstone'],
    city: "Sydney"
  }],
  CUSTOMER_HEADER: 'CUSTOMER_ID',
  PAGE_SIZE: 5,
  mapsq_six_nsw: "https://mapsq.six.nsw.gov.au/services/public/Address_Location",
  // mapsq_six_nsw: "https://mapsq.six.nsw.gov.au/services/public/Address_Location?roadName=Merriville&postCode=2155&projection=EPSG%3A4326,

};
//config connection
