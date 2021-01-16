import WebSocket from 'ws';
import sessionController from './sessionController';
import { WSS_PORT } from '@constants';
import { IIncomingMessageData, IOutcommingMessageData, ISession } from '@types';

const wss = new WebSocket.Server({ port: WSS_PORT });

wss.on('connection', (ws: WebSocket) =>
  sessionController(ws).then((session: ISession) => {
    ws.send(JSON.stringify(session.data));

    ws.on('message', (json: string) => {
      console.log(json);
      const { qID, answer }: IIncomingMessageData = JSON.parse(json);
      session.updateData(qID, answer);
    });

    session.createOnUpdate((qID, answers) =>
      ws.send(JSON.stringify({ qID, answers } as IOutcommingMessageData)));
  })
);
