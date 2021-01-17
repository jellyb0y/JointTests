import WebSocket from 'ws';
import https from 'https';
import fs from 'fs';
import sessionController from './sessionController';
import { WSS_PORT, SSL_KEY_PATH, SSL_CERT_PATH } from '@constants';
import { IIncomingData, ISyncDataMessage } from '@types';
import { ISession } from './sessionController/sessionController.types';

const options = {
  key: fs.readFileSync(SSL_KEY_PATH),
  cert: fs.readFileSync(SSL_CERT_PATH)
};

const wss = new WebSocket.Server({
  server: https.createServer(options)
    .listen(WSS_PORT, () => console.log(`Server [WSS] on *:${WSS_PORT}`))
});

wss.on('connection', (ws: WebSocket) =>
  sessionController(ws).then((session: ISession) => {
    ws.send(JSON.stringify({ data: session.data } as ISyncDataMessage));

    ws.on('message', (json: string) => {
      const incomingData: IIncomingData = JSON.parse(json);
      Object.entries(incomingData).forEach(([qID, data]) => session.updateData({ qID, ...data }));
    });

    session.createOnUpdate((data, questionsToDispatch) =>
      ws.send(JSON.stringify({ data, questionsToDispatch }))
    );
  }).catch((specialMessage: string) => {
    ws.send(JSON.stringify({ error: specialMessage || 'could not create session' }));
    ws.close()
  })
);

wss.on
