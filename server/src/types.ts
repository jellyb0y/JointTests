export interface IStorage {
  [key: string]: {
    data: ISession['data'],
    callbacks: IUserList<ICallback>;
    countSessions: number;
  };  
}

export interface ISession {
  data: {
    [qID: number]: IUserList<IAnswer>;
  };
  createOnUpdate: (callback: ICallback) => void;
  updateData: (qID: number, answer: IAnswer) => void;
}

export type IAnswer = string[]; 

export type IUserList<R> = {
  [user: string]: R;
}

export type ICallback = (qID: number, answers: IUserList<IAnswer>) => void;

export interface IAuthMessage {
  hash: string;
  userID: string;
}

export interface IIncomingMessageData {
  qID: number;
  answer: IAnswer;
}

export interface IOutcommingMessageData {
  qID: number;
  answers: IUserList<IAnswer>;
}
