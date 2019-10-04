const EventEmitter = require('events');

/**
 * balancer class
 */
module.exports = class balancer extends EventEmitter {
  /**
   * constructor
   * @param {Number} timeout   delay between emits
   * @param {Number} msgCount  message per emit
   * @param {Number} cleanTime old users clean time (ms)
   * @param {Array}  queue     array for queue
   * @param {Map}    users     map for users
   */
  constructor({
    timeout   = 34,
    msgCount  = 1,
    cleanTime = 10000,
    queue     = [],
    users     = new Map(),
    DEBUG     = false
  } = {}) {
    super();

    this.cfg = {
      timeout,
      msgCount,
      cleanTime,
      queue,
      users,
      DEBUG
    };

    this.interval = null;

    if (
      !Array.isArray(this.cfg.queue)
      || !this.cfg.users instanceof Map
      || !(this.cfg.timeout && parseInt(this.cfg.timeout, 10))
      || !(this.cfg.msgCount && parseInt(this.cfg.msgCount, 10))) {
        throw new Error('Wrong balancer settings!');
      }
  }

  /**
   * set user data
   * @param {Number} id
   * @param {Boolean} wait
   */
  setUser(id, wait) {
    if (this.DEBUG) console.log(`[USER] User update: `, id, wait);
    this.cfg.users.set(id, {
      wait,
      time : Date.now()
    });
  }

  /**
   * get user from local storage
   * @param  {Number} id
   * @return {Object}
   */
  getUser(id) {
    return this.cfg.users.get(id);
  }

  /**
   * starts cleaning old users
   * save ram + user can try again after cleanTime
   * if his 'wait' boolean stuck
   */
  localUsersCleaner() {
    if (this.DEBUG) console.log(`[USER] Starting user cleaner`);
    setInterval(() => {
      for (let k of this.cfg.users.entries()) {
        if (k[1].time + this.cfg.cleanTime < Date.now()) {
          if (this.DEBUG) console.log(`[USER] Deleting `, k[0]);
          this.cfg.users.delete(k[0]);
        }
      }
    }, this.cfg.cleanTime);
  }

  /**
   * add action to queue
   * @param  {Object}  data
   */
  add(data) {
    if (this.DEBUG) console.log(`[QUEUE] added to queue `, data);
    this.cfg.queue.push(data);
  }

  /**
   * start balancer
   * it starts interval wich emit events each "timeout" msec
   */
  start() {
    if (this.DEBUG) console.log(`[QUEUE] Starting queue. msgCount ${this.cfg.msgCount}, timeout ${this.cfg.timeout}`);
    /**
     * balancer itself
     * emits each interval
     */
    let balancer = () => {
      let messages = this.cfg.queue.splice(0, this.cfg.msgCount);

      for (let i = 0; i < messages.length; i++) {
        this.emit(messages[i].type, messages[i]);
      }
    }

    this.interval = setInterval(balancer, this.cfg.timeout);
  }

  /**
   * stop balancer's interval
   */
  stop() {
    if (this.DEBUG) console.log(`[QUEUE] Stopped queue`);
    clearInterval(this.interval);
  }
}
