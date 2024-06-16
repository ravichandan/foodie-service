import { MongoClient, ServerApiVersion } from 'mongodb';

async function main() {
	/**
	 * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
	 * See https://docs.mongodb.com/drivers/node/ for more details
	 */
	// const uri = "mongodb+srv://<username>:<password>@<your-cluster-url>/sample_airbnb?retryWrites=true&w=majority";
	// const uri = "mongodb+srv://127.0.0.1:27017/tastybuds?retryWrites=true&w=majority";

	// Replace the placeholder with your Atlas connection string
	const uri = 'mongodb://127.0.0.1:27017/qa'; //?retryWrites=true&w=majority";

	/**
	 * The Mongo Client you will use to interact with your database
	 * See https://mongodb.github.io/node-mongodb-native/3.6/api/MongoClient.html for more details
	 * In case: '[MONGODB DRIVER] Warning: Current Server Discovery and Monitoring engine is deprecated...'
	 * pass option { useUnifiedTopology: true } to the MongoClient constructor.
	 * const client =  new MongoClient(uri, {useUnifiedTopology: true})
	 */
	// Create a MongoClient with a MongoClientOptions object to set the Stable API version
	const client = new MongoClient(uri, {
		serverApi: {
			version: ServerApiVersion.v1,
			strict: true,
			deprecationErrors: true,
		},
	});

	try {
		// Connect to the MongoDB cluster
		await client.connect();

		// Make the appropriate DB calls

		// Add functions that make DB calls here

		async function createListing(client, newListing) {
			const result = await client.db('sample_airbnb').collection('listingsAndReviews').insertOne(newListing);
			console.log(`New listing created with the following id: ${result.insertedId}`);
		}

		// Create a single new listing
		await createListing(client, {
			name: 'Lovely Loft',
			summary: 'A charming loft in Paris',
			bedrooms: 1,
			bathrooms: 1,
		});
	} finally {
		// Close the connection to the MongoDB cluster
		await client.close();
	}
}

main().catch(console.error);
