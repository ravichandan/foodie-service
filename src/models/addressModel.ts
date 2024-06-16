// creating ADDRESS model
export type AddressModel =  {

	// includes door no, street name, etc
	line: string;

	// Suburb
	suburb: string; // max 50 chars

	// postcode
	postcode: number; // create Index

	// state
	state: string; // max 50 characters
	city: string; // max 50 characters

	// country
	country: string; // only australia as of now

	// createdAt: Date;
	// modifiedAt: Date;
};
