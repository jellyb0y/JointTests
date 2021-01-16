import WebSocket from 'ws';
import https from 'https';
import fs from 'fs';
import sessionController from './sessionController';
import { WSS_PORT, SSL_KEY_PATH, SSL_CERT_PATH } from '@constants';
import { IIncomingMessageData, IOutcommingMessageData, ISyncDataMessage, ISession } from '@types';

var options = {
  key: fs.readFileSync(SSL_KEY_PATH),
  cert: fs.readFileSync(SSL_CERT_PATH)
};

const wss = new WebSocket.Server({
  server: https.createServer(options)
    .listen(WSS_PORT, () => console.log(`Server [WSS] on *:${WSS_PORT}`))
});

wss.on('connection', (ws: WebSocket) =>
  sessionController(ws).then((session: ISession) => {
    ws.send(JSON.stringify({ fullData: session.data } as ISyncDataMessage));

    ws.on('message', (json: string) => {
      const { qID, answer }: IIncomingMessageData = JSON.parse(json);
      session.updateData(qID, answer);
    });

    session.createOnUpdate((qID, answers) =>
      ws.send(JSON.stringify({ qID, answers } as IOutcommingMessageData)));
  }).catch(() => ws.close())
);
