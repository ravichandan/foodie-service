import { correlationHeader, handleBodyRequestParsing, handleCompression, handleCors, responseTime } from './common';

export default [handleBodyRequestParsing, handleCompression, handleCors, responseTime, correlationHeader];
