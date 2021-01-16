import WebSocket from 'ws';
import md5 from 'md5';
import { IAnswer, IAuthMessage, ISession, IStorage } from '@types';
import { SESSION_TIMEOUT, SERVER_SECRET } from '@constants';

export const sessions: IStorage = {};

export const getSession = (hash: string, userID: string): ISession => {
  const {
    data = {},
    callbacks = {}
  } = sessions[hash] || {};
  
  if (!(hash in sessions)) {
    sessions[hash] = { data, callbacks };
  }

  const createOnUpdate = (callback): void => {
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
        resolve(getSession(hash, userID));
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
