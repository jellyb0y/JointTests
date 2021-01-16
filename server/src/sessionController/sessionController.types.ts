import { IUserList, ICallback, IDataItem, IQuestionData } from '@types';

export interface IStorage {
  [key: string]: {
    countSessions: number;
  } & Pick<IDispatcherData, 'data' | 'callbacks' | 'questionsToDispatch'>;  
}

export interface ISession {
  data: {
    [qID: number]: IDataItem;
  };
  createOnUpdate: (callback: ICallback) => void;
  updateData: (data: IQuestionData) => void;
}

export interface IDispatcherData {
  data: ISession['data'],
  callbacks: IUserList<ICallback>;
  questionsToDispatch: number[];
  userID: string;
}
