//importing modules
import { initClient } from 'mongo-http';


const client = initClient({
  // appId: process.env.appId || config.appId || 'data-ttagxfs',
  appId: 'data-ttagxfs',
  apiKey: 'xhASmry6QFCsGLeavZANlpPgfEnjeNXzuzAf9IzdfM1v4JSd17yQ7NYA8jDFIngM',
  // apiKey: process.env.appKey || config.appKey || 'xhASmry6QFCsGLeavZANlpPgfEnjeNXzuzAf9IzdfM1v4JSd17yQ7NYA8jDFIngM',
  // Important! Pass `appRegion` if you deploy Data API as "Local (single region)"
  // See above "1. Setup MongoDB Atlas to get the App ID and API Key (and App Region)"
  // appRegion: process.env.appRegion || config.appRegion || 'ap-southeast-2',
  appRegion: 'ap-southeast-2',
  // databaseName: process.env.databaseName || 'sample_mflix',

});

export const db = client.database({ databaseName: 'qa' });

