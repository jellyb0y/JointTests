import WebSocket from 'ws';
import md5 from 'md5';
import { IAnswer, IAuthMessage, ISession, IStorage } from '@types';
import { SESSION_TIMEOUT, SERVER_SECRET, MAX_SESSIONS } from '@constants';

export const sessions: IStorage = {};

export const getSession = (hash: string, userID: string): ISession | undefined => {
  const {
    data = {},
    callbacks = {},
    countSessions = 0
  } = sessions[hash] || {};

  if (countSessions > MAX_SESSIONS) {
    return;
  }
  
  if (!(hash in sessions)) {
    sessions[hash] = { countSessions, data, callbacks };
  }

  const createOnUpdate = (callback): void => {
    if (!(userID in callbacks)) {
      sessions[hash].countSessions += 1;
    }

    callbacks[userID] = callback;
  };

  const updateData = (qID: number, answer: IAnswer): void => {
    if (!data[qID]) {
      data[qID] = {};
    }

    data[qID][userID] = answer;
    Object.entries(callbacks).forEach(([user, callback]) => {
      if (user === userID) {
        return;
      }

      callback(qID, data[qID]);
    });
  };
  
  return {
    data,
    createOnUpdate,
    updateData
  };
};

const sessionController = (ws: WebSocket): Promise<ISession> =>
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

export default sessionController;
