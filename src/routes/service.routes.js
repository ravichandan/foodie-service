'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
Object.defineProperty(exports, '__esModule', { value: true });
// import {validateKeyQueryParams, validateSetDataJson} from "../../middleware/validations";
const Utils_1 = require('../utils/Utils');
const log = (0, Utils_1.getLogger)('routes');
exports.default = [
  {
    path: '/pulse',
    method: 'get',
    handler: (req, res) =>
      __awaiter(void 0, void 0, void 0, function* () {
        res.sendStatus(200);
      }),
  },
  {
    path: '/',
    method: 'get',
    handler: (req, res) => {
      log.trace('Server is up and running');
      res.send('Up and running!!');
    },
  },
];
//# sourceMappingURL=service.routes.js.map
