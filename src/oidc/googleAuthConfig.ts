export const config ={

	issuer: 'https://accounts.google.com',

	clientId: '7360139281-qbgics3laaps2sapu417fhkfmgcc4bja.apps.googleusercontent.com',

	clientSecret: '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',

	userinfoEndpoint: "https://openidconnect.googleapis.com/v1/userinfo",

	responseType: 'code',
	scope: 'openid profile email ',


	tokenEndpoint: 'https://oauth2.googleapis.com/token',
	jwks_uri: "https://www.googleapis.com/oauth2/v3/certs",
	revocation_endpoint: "https://oauth2.googleapis.com/revoke",

	// silentRefreshTimeout: 5000, // For faster testing
	// timeoutFactor: 0.25,
};
