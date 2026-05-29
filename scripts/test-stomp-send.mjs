/**
 * Integration test: STOMP send message to existing DM conversation.
 * Usage: node scripts/test-stomp-send.mjs
 */
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import crypto from 'node:crypto';

const JWT_SECRET = 'dev-local-jwt-secret-change-before-production-min-32-chars';
const CONVERSATION_ID = '1f4dd961-cb68-4855-b1e2-e6af1e19f8ad';
const SENDER_ID = 'ff1fbbc3-de76-46c3-978a-e700d3de2692'; // boaiuh (receiver who accepted)
const WS_URL = 'http://localhost:8080/ws';
const GATEWAY = 'http://localhost:8080';

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(userId, email) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(
    JSON.stringify({
      sub: email,
      userId,
      username: email.split('@')[0],
      iat: now,
      exp: now + 3600,
    })
  );
  const data = `${header}.${payload}`;
  const sig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${sig}`;
}

async function getMessages(authToken) {
  const res = await fetch(
    `${GATEWAY}/api/conversations/${CONVERSATION_ID}/messages?limit=50`,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  const text = await res.text();
  if (!res.ok) {
    console.error('GET messages failed:', res.status, text);
    return [];
  }
  const json = JSON.parse(text);
  return json.data ?? [];
}

const token = signJwt(SENDER_ID, '22691861.bao@student.iuh.edu.vn');

const before = await getMessages(token);
console.log('Messages before:', before.length);

let received = null;
let stompError = null;

const client = new Client({
  webSocketFactory: () => new SockJS(`${WS_URL}?access_token=${encodeURIComponent(token)}`),
  connectHeaders: { Authorization: `Bearer ${token}` },
  reconnectDelay: 0,
  debug: (msg) => console.log('[STOMP]', msg),
  onStompError: (frame) => {
    stompError = frame.headers['message'] || frame.body || 'STOMP error';
    console.error('[STOMP ERROR]', stompError, frame.body);
  },
});

await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('Timeout waiting for message')), 15000);

  client.onConnect = () => {
    console.log('Connected');
    client.subscribe(`/topic/conversation/${CONVERSATION_ID}`, (msg) => {
      received = JSON.parse(msg.body);
      console.log('Received message:', received);
      clearTimeout(timeout);
      client.deactivate();
      resolve();
    });

    client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({
        conversationId: CONVERSATION_ID,
        senderId: SENDER_ID,
        content: `test-${Date.now()}`,
        type: 'TEXT',
      }),
    });
    console.log('Published send');
  };

  client.onWebSocketError = (e) => {
    clearTimeout(timeout);
    reject(e);
  };

  client.activate();
});

await new Promise((r) => setTimeout(r, 500));
const after = await getMessages(token);
console.log('Messages after:', after.length);
console.log('Received via WS:', received ? 'YES' : 'NO');
console.log('STOMP error:', stompError ?? 'none');

if (!received) {
  process.exitCode = 1;
}
