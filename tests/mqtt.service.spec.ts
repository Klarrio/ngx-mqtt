import { MqttService } from '../src/index';
import { connect, IPublishPacket, Packet } from '../src/mqtt';

/* Be aware, that you need a broker that listens on websockets on port 9001 */
describe('mqtt', () => {
  let client;
  it('is defined', () => {
    expect(connect).toBeDefined();
  });

  it('can connect', () => {
    client = connect('wss://localhost:9001/mqtt', {
      protocol: 'ws',
      hostname: 'localhost',
      port: 9001,
      path: '/'
    });
    expect(client).toBeDefined();
  });

  it('can publish/subscribe', (done) => {
    client.subscribe('$test/message1');
    client.publish('$test/message1', 'Hello World!');
    client.on('message', (topic: string, msg: IPublishPacket, packet: Packet) => {
      expect(msg).toBeDefined();
      done();
    });
  });
});

describe('MqttService', () => {
  it('is defined', () => {
    expect(MqttService).toBeDefined();
  });
});

describe('MqttService.filterMatchesTopic', () => {
  it('is defined', () => {
    expect(MqttService.filterMatchesTopic).toBeDefined();
  });
  const matches: any = [
    ['$', '#', false],
    ['a', 'a', true],
    ['a', '#', true],
    ['a', 'a/#', true],
    ['a/b', 'a/#', true],
    ['a/b/c', 'a/#', true],
    ['b/c/d', 'a/#', false],
    ['a', 'a/+', false],
    ['a', '/a', false],
    ['a/b', 'a/b', true],
    ['a/b/c', 'a/+/c', true],
    ['a/b/c', 'a/+/d', false],
    ['#', '$SYS/#', false],
    ['a/b', 'a/+', true],
    ['a/b', 'a/#', true],
    ['a/b', 'a/b/#', true],
    ['a/b/c', 'a/b/c', true],
  ];
  for (let i = 0; i < matches.length; i++) {
    it(`${matches[i][0]} matches ${matches[i][1]}: ${matches[i][2]}`, () => {
      expect(MqttService.filterMatchesTopic(matches[i][1], matches[i][0])).toBe(matches[i][2]);
    });
  }
});
