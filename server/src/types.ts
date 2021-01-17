import { ISession } from './sessionController/sessionController.types';
 
export type IAnswer = string[];

export interface IDataItem {
  answers: IUserList<IAnswer>;
  activeUsers: string[];
}

export interface IQuestionData {
  qID: number;
  answer: IAnswer;
  isActive: boolean;
}

export interface IIncomingData {
  [qID: number]: Pick<IQuestionData, 'answer' | 'isActive'>;
}

export type IUserList<R> = {
  [user: string]: R;
}

export type ICallback = (data: ISession['data'], updatedQuestions: number[]) => void;

export interface IAuthMessage {
  hash: string;
  userID: string;
  ver: string;
}

export interface ISyncDataMessage {
  data: ISession['data'];
}
