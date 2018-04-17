'use strict';

/**
 * Module dependencies
 */
import * as xtend from 'xtend';

import { Readable } from 'readable-stream';

let streamsOpts = { objectMode: true };
let defaultStoreOptions = {
  clean: true
};

export interface IStoreOptions {
  /**
   * true, clear _inflights at close
   */
  clean?: boolean;
}


/**
 * In-memory implementation of the message store
 * This can actually be saved into files.
 *
 * @param {Object} [options] - store options
 */
export class Store {
  public options;
  private _inflights;

  constructor(options?: IStoreOptions) {
    if (!(this instanceof Store)) {
      return new Store(options);
    }

    this.options = options || {};

    // Defaults
    this.options = xtend(defaultStoreOptions, options);

    this._inflights = {};
  }

  /**
   * Adds a packet to the store, a packet is
   * anything that has a messageId property.
   *
   */
  public put(packet: any, cb?: Function): this {
    this._inflights[packet.messageId] = packet;

    if (cb) {
      cb();
    }

    return this;
  }

  /**
   * Creates a stream with all the packets in the store
   *
   */
  public createStream(): any {
    let stream = new Readable(streamsOpts);
    let inflights = this._inflights;
    let ids = Object.keys(this._inflights);
    let destroyed = false;
    let i = 0;

    stream._read = function () {
      if (!destroyed && i < ids.length) {
        this.push(inflights[ids[i++]]);
      } else {
        this.push(null);
      }
    };

    stream.destroy = function () {
      if (destroyed) {
        return;
      }

      destroyed = true;
      setTimeout(() => {
        this.emit('close');
      });
    };

    return stream;
  }

  /**
   * deletes a packet from the store.
   */
  public del(packet: any, cb: Function): this {
    packet = this._inflights[packet.messageId];
    if (packet) {
      delete this._inflights[packet.messageId];
      cb(null, packet);
    } else if (cb) {
      cb(new Error('missing packet'));
    }

    return this;
  }

  /**
   * get a packet from the store.
   */
  public get(packet: any, cb: Function): this {
    packet = this._inflights[packet.messageId];
    if (packet) {
      cb(null, packet);
    } else if (cb) {
      cb(new Error('missing packet'));
    }

    return this;
  }

  /**
   * Close the store
   */
  public close(cb: Function): void {
    if (this.options.clean) {
      this._inflights = null;
    }
    if (cb) {
      cb();
    }
  }
}
