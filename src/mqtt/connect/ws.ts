'use strict';

import * as websocket from 'websocket-stream';
import * as  urlModule from 'url';

let WSS_OPTIONS = [
  'rejectUnauthorized',
  'ca',
  'cert',
  'key',
  'pfx',
  'passphrase'
];

function buildUrl(opts, client) {
  let url = opts.protocol + '://' + opts.hostname + ':' + opts.port + opts.path;
  if (typeof (opts.transformWsUrl) === 'function') {
    url = opts.transformWsUrl(url, opts, client);
  }
  return url;
}

function setDefaultOpts(opts) {
  if (!opts.hostname) {
    opts.hostname = 'localhost';
  }
  if (!opts.port) {
    if (opts.protocol === 'wss') {
      opts.port = 443;
    } else {
      opts.port = 80;
    }
  }
  if (!opts.path) {
    opts.path = '/';
  }

  if (!opts.wsOptions) {
    opts.wsOptions = {};
  }
}

function createWebSocket(client, opts) {
  let websocketSubProtocol =
    (opts.protocolId === 'MQIsdp') && (opts.protocolVersion === 3)
      ? 'mqttv3.1'
      : 'mqtt';

  setDefaultOpts(opts);
  let url = buildUrl(opts, client);
  return websocket(url, [websocketSubProtocol], opts.wsOptions);
}

export default function buildBuilderBrowser(client, opts) {
  if (!opts.hostname) {
    opts.hostname = opts.host;
  }

  if (!opts.hostname) {
    // Throwing an error in a Web Worker if no `hostname` is given, because we
    // can not determine the `hostname` automatically.  If connecting to
    // localhost, please supply the `hostname` as an argument.
    if (typeof (document) === 'undefined') {
      throw new Error('Could not determine host. Specify host manually.');
    }
    let parsed = urlModule.parse(document.URL);
    opts.hostname = parsed.hostname;

    if (!opts.port) {
      opts.port = parsed.port;
    }
  }
  return createWebSocket(client, opts);
}