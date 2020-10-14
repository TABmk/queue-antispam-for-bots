# queue-antispam-for-bots
Simple tools for queue and spam check without dependencies

There was a better version, but i've lost it on my hard drive, so

TODO:
- [ ] full refactoring

# Previews:

### bulk send with { timeout : 400, msgCount : 2 }
##### telegram test with [telegraf](https://telegraf.js.org) module
![](https://media.giphy.com/media/cnX5TzXRpxVhM14YpX/giphy.gif)

##### vk.com test with raw api requests using [node-fetch](https://www.npmjs.com/package/node-fetch)
![](https://media.giphy.com/media/SSE3H46Cu61RjJQfx0/giphy.gif)

### spam test
##### [telegraf](https://telegraf.js.org) based telegram bot
![](https://media.giphy.com/media/W4iDep0iNEq8sdjhCa/giphy.gif)

# Usage:
1. Throw `queue.js` in your project
2. include it:
```
const queueAPI = require('./queue');

const Queue = new queueAPI({
 timeout   : 100,       // optional | Number  | Default : 34
 msgCount  : 2,         // optional | Number  | Default : 1
 msgLimit  : 10,        // optional | Number  | Default : 10
 cleanTime : 10000,     // optional | Number  | Default : 60000
 queue     : [],        // optional | Array   | Default : []
 users     : new Map(), // optional | Map     | Default : new Map()
 blacklist : new Set(), // optional | Set     | Default : new Set()
 userMsg   : new Map(), // optional | Map     | Default : new Map()
 DEBUG     : true       // optional | Boolean | Default : false
});
```

## Methods:

### blacklist

Also not a method. This is [Set](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Set) and you can use its methods like `.add` for add user to blacklist and `.has` to check if user blocked. This set is only alive while app is alive! If you need save blocked users - use `Array.from(Queue.blacklist)` and store this array wherever you need. And on start just pass existing array to constructor like `{ ... blacklist : new Set(oldArray) ... }`

### getUserMessages(id)

Return user messages count. (count is alive only one cleaner interval)

- id `Number` - user id

### incUser(id)

Increase user's messages count

- id `Number` - user id

### isBlocked(id)

Check if user reached your messages limit. Default limit is 10 msg per cleaner interval. But module not blocking user by itself. If you need use limit feature, just set your limit in constructor and then add `if (!Queue.isBlocked(id)) {}` to your code.

- id `Number` - user id

### setUser(id, wait)

set user data:
```
id => {
  wait : wait,
  time : Date.now()
}
```

- id   `Number`  - unique id
- wait `Boolean` - is user waiting for reply

### getUser(id)

get user data

- id   `Number`  - unique id

### localUsersCleaner()

Start cleaner interval (cleanTime). Save ram and if even user stuck with `wait`, he will be removed after cleanTime.
Can also start with existing map, just pass it to constructor

### add(data)

Add object to queue.

```
{
  type : 'message' // event name
  ...
}
```
- data `Object` - data to be sent in queue, example above

### start()

Start queue interval. `msgCount` messages will be deleted from queue and sent via emiting your event

### stop()

Stop queue

# Examples

## Full example for bot
```
...

const queueAPI = require('./queue');

const Queue = new queueAPI({
 timeout   : 100,
 msgCount  : 2,
 cleanTime : 10000,
 DEBUG     : true
});

yourBot.command('help', async (ctx) => {
 // check if user if blacklist
 if (!Queue.blacklist.has(ctx.id)) {
  // setup user, if no local found
  if (!Queue.getUser(ctx.id)) Queue.setUser(ctx.id, false);

  // increase user's messages
  Queue.incUser(id);

  // for example ban user if he sent 100 msg in one cleaner interval
  if (Queue.getUserMessages(ctx.id) > 100) Queue.blacklist.add(ctx.id);

  // check if user exists in map and need reply
  // also check if user reached messages limit per cleaner
  if (Queue.getUser(ctx.id) && !Queue.getUser(ctx.id).wait && !Queue.isBlocked(ctx.id)) {
    // set 'need reply' aka `wait` to true
    // to prevent sending more messages
    Queue.setUser(ctx.id, true);

    Queue.add({
      type   : 'message',
      params : [ctx.id, 'help message'],
      id     : ctx.id,
      try    : 1
    });
  }
 }
});

Queue.on('message', data => {
  yourBot.send(...data.params)
    .then(Queue.setUser(data.id, false)) // bot now can reply to user
    .catch(async (err) => {
      console.error(err);
      // try send again on error
      if (data.try <= 3) {
        data.try++;
        Queue.add(data);
      } else {
        Queue.setUser(data.id, false);
      }
    });
});

Queue.localUsersCleaner();
Queue.start();
```

## Bulk send
```
const queueAPI = require('./queue');

const Queue = new queueAPI();

// add 100 messages to queue
for (var i = 0; i < 100; i++) {
  Queue.add({
    type   : 'message',
    params : [ctx.id, i]
  })
}

// for full handler check example above
Queue.on('message', data => {
  yourBot.send(...data.params)
});

Queue.start();
```
