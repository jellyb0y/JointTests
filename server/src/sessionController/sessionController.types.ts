import { IUserList, ICallback, IDataItem, IQuestionData } from '@types';

export interface IStorage {
  [key: string]: IStorageItem;
}

export interface IStorageItem extends Pick<IDispatcherData, 'data' | 'callbacks' | 'questionsToDispatch'> {
  countSessions: number;
}

export interface ISession {
  id: number;
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
