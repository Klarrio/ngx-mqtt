'use strict';

import * as url from 'url';
import * as xtend from 'xtend';
import { MqttClient } from '../client';
import { Store } from '../store';
import ws from './ws';

const protocols = {
  ws: ws,
  wss: ws
};

/**
 * Parse the auth attribute and merge username and password in the options object.
 *
 * @param {Object} [opts] option object
 */
function parseAuthOptions(opts) {
  let matches;
  if (opts.auth) {
    matches = opts.auth.match(/^(.+):(.+)$/);
    if (matches) {
      opts.username = matches[1];
      opts.password = matches[2];
    } else {
      opts.username = opts.auth;
    }
  }
}

/**
 * connect - connect to an MQTT broker.
 *
 * @param {String} [brokerUrl] - url of the broker, optional
 * @param {Object} opts - see MqttClient#constructor
 */
export function connect(brokerUrl, opts) {
  if ((typeof brokerUrl === 'object') && !opts) {
    opts = brokerUrl;
    brokerUrl = null;
  }

  opts = opts || {};

  if (brokerUrl) {
    let parsed = url.parse(brokerUrl, true);
    if (parsed.port != null) {
      parsed.port = Number(parsed.port).toString();
    }

    opts = xtend(parsed, opts);

    if (opts.protocol === null) {
      throw new Error('Missing protocol');
    }
    opts.protocol = opts.protocol.replace(/:$/, '');
  }

  // merge in the auth options if supplied
  parseAuthOptions(opts);

  // support clientId passed in the query string of the url
  if (opts.query && typeof opts.query.clientId === 'string') {
    opts.clientId = opts.query.clientId;
  }

  if (opts.cert && opts.key) {
    if (opts.protocol) {
      if (['wss'].indexOf(opts.protocol) === -1) {
        switch (opts.protocol) {
          case 'ws':
            opts.protocol = 'wss';
            break;
          default:
            throw new Error('Unknown protocol for secure connection: "' + opts.protocol + '"!');
        }
      }
    } else {
      // don't know what protocol he want to use, mqtts or wss
      throw new Error('Missing secure protocol key');
    }
  }

  if (!protocols[opts.protocol]) {
    let isSecure = ['wss'].indexOf(opts.protocol) !== -1;
    opts.protocol = [
      'ws',
      'wss'
    ].filter(function (key, index) {
      if (isSecure && index % 2 === 0) {
        // Skip insecure protocols when requesting a secure one.
        return false;
      }
      return (typeof protocols[key] === 'function');
    })[0];
  }

  if (opts.clean === false && !opts.clientId) {
    throw new Error('Missing clientId for unclean clients');
  }

  function wrapper(client) {
    if (opts.servers) {
      if (!client._reconnectCount || client._reconnectCount === opts.servers.length) {
        client._reconnectCount = 0;
      }

      opts.host = opts.servers[client._reconnectCount].host;
      opts.port = opts.servers[client._reconnectCount].port;
      opts.hostname = opts.host;

      client._reconnectCount++;
    }

    return protocols[opts.protocol](client, opts);
  }

  return new MqttClient(wrapper, opts);
}

export * from '../store';
export * from '../client';
