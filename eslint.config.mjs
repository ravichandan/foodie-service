import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';


		// ignores: ["dist/","**/**.js","**.js","**/.js","*.js",".js","**/utils/*"],
export default [

	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	{
		languageOptions: { globals: globals.browser } ,
		ignores: [ "webpack.config.js"],
		rules: {
            noExplicitAny: false,
        }

	},

];
