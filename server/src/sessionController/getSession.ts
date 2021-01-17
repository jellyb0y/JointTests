import { IQuestionData } from '@types';
import { MAX_SESSIONS, MAX_CONNECTIONS, CALLBACK_DEBOUNCE_TIME } from '@constants';
import { sessions } from './sessionController';
import * as T from './sessionController.types';

let timeoutToSend: NodeJS.Timeout;
let isPending: boolean;
let countSessions = 0;

export const dispatchCallbacks = ({
  callbacks,
  data,
  userID,
  questionsToDispatch
}: T.IDispatcherData) => {
  const task = (): void => {
    Object.entries(callbacks).forEach(([user, callback]) => {
      if (user === userID) {
        return;
      }
  
      callback(data, questionsToDispatch);
    });

    isPending = false;
    timeoutToSend = setTimeout(() => {
      timeoutToSend = null;
      if (isPending) {
        task();
      }
    }, CALLBACK_DEBOUNCE_TIME);
  };

  if (!timeoutToSend) {
    task();
  } else {
    isPending = true;
  }
}  

export const getSession = (hash: string, userID: string): T.ISession | undefined => {
  let session: T.IStorageItem = sessions[hash];

  const {
    data = {},
    callbacks = {},
    questionsToDispatch = [],
    countConnections = 0
  } = session || {};

  
  if (!(hash in sessions)) {
    session = sessions[hash] = {
      countConnections,
      data,
      callbacks,
      questionsToDispatch
    };
    countSessions += 1;
  }

  if (countSessions > MAX_SESSIONS - 1) {
    return;
  }

  const callCallbacksDispatcher = () => {
    dispatchCallbacks({
      callbacks,
      userID,
      data,
      questionsToDispatch
    });
    session.questionsToDispatch = [];
  };

  const createOnUpdate = (callback): void => {
    if (!(userID in callbacks)) {
      session.countConnections += 1;
    }

    callbacks[userID] = callback;
  };

  if (countConnections > MAX_CONNECTIONS - 1) {
    return;
  }

  const updateData = ({ qID, answer, isActive }: IQuestionData): void => {
    if (!data[qID]) {
      data[qID] = {
        answers: {},
        activeUsers: []
      };
    }

    if (!questionsToDispatch.includes(qID)) {
      questionsToDispatch.push(qID);
    }
    
    if (answer !== undefined) {
      data[qID].answers[userID] = answer;
    }

    if (isActive !== undefined) {
      if (isActive) {
        if (!data[qID].activeUsers.includes(userID)) {
          data[qID].activeUsers.push(userID);
        }
      } else {
        data[qID].activeUsers = data[qID].activeUsers.filter(value => value && value !== userID);
      }
    }

    callCallbacksDispatcher();
  };
  
  return {
    id: Math.floor(Math.random() * Date.now()),
    data,
    createOnUpdate,
    updateData
  };
};
