import { IQuestionData } from '@types';
import { MAX_SESSIONS, CALLBACK_DEBOUNCE_TIME } from '@constants';
import { sessions } from './sessionController';
import * as T from './sessionController.types';

let timeoutToSend: NodeJS.Timeout;
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
  };

  if (!timeoutToSend) {
    task();
  } else {
    clearTimeout(timeoutToSend);
  }

  timeoutToSend = setTimeout(() => {
    timeoutToSend = null;
    task();
  }, CALLBACK_DEBOUNCE_TIME);
}
  

export const getSession = (hash: string, userID: string): T.ISession | undefined => {
  let session: T.IStorageItem = sessions[hash];

  const {
    data = {},
    callbacks = {},
    questionsToDispatch = [],
    countSessions = 0
  } = session || {};

  
  if (!(hash in sessions)) {
    session = sessions[hash] = {
      countSessions,
      data,
      callbacks,
      questionsToDispatch
    };
  }

  const callCallbacksDispatcher = () => {
    dispatchCallbacks({
      callbacks,
      userID,
      data,
      questionsToDispatch
    });
    session.questionsToDispatch = [];
    console.log(session);
  };

  const createOnUpdate = (callback): void => {
    if (!(userID in callbacks)) {
      session.countSessions += 1;
    }

    callbacks[userID] = callback;
  };

  if (countSessions > MAX_SESSIONS - 1) {
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
