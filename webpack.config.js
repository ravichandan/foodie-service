const path = require('path');

module.exports = {
	entry: './src/server/app.ts',
	output: {
		filename: 'api.bundle.js',
		path: path.resolve(__dirname, 'dist'),
	},
	mode: 'production',
	module: {
		rules: [
			{ test: /\.tsx?$/, loader: 'ts-loader', exclude: /node_modules/ },
			{ test: /\.json/, loader: 'json-loader', exclude: /node_modules/ },
			{ test: /\.node$/, loader: 'node-loader' },
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js', '.json'],
		alias: {
			hiredis: path.join(__dirname, 'aliases/hiredis.js'),
		},
	},
	target: 'node',
	node: {
		__dirname: true,
	},
	plugins: [],
	externals: {
		snappy: 'commonjs snappy',
	},
};
