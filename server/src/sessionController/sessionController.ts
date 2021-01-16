import WebSocket from 'ws';
import md5 from 'md5';
import { IAuthMessage } from '@types';
import { SESSION_TIMEOUT, SERVER_SECRET } from '@constants';
import { getSession } from './getSession';
import * as T from './sessionController.types';

export const sessions: T.IStorage = {};

export const sessionController = (ws: WebSocket): Promise<T.ISession> =>
  new Promise((resolve, reject) => {
    let isResolved = false;

    const callback = (json: string) => {
      let { hash, userID }: IAuthMessage = JSON.parse(json);

      if (!userID) { 
        userID = md5(`${SERVER_SECRET}:${Date.now()}`);
        ws.send(JSON.stringify({ userID }));
      }

      if (!hash) {
        reject();
      } else {
        const session = getSession(hash, userID);

        if (!session) {
          reject();
        } else {
          resolve(session);
        }
      }

      ws.removeListener('message', callback)
    };

    ws.on('message', callback);

    setTimeout(() => {
      if (!isResolved) {
        reject();
        ws.removeListener('message', callback);
      }
    }, SESSION_TIMEOUT);
  });

