import { OAuth2Client } from 'google-auth-library';
import { config as gc } from './googleAuthConfig';

export const googleJwtValidator = async (token: string) => {
  const client = new OAuth2Client();
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: gc.clientId, // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    const userid = payload?.['sub'];
    console.log('in jwt verify, payload:: ', payload);
    console.log('in jwt verify, userid:: ', userid);
    return payload;
    // If the request specified a Google Workspace domain:
    // const domain = payload['hd'];
  }
  return await verify().catch((_) => undefined);
};
