# queue-antispam-for-bots
Simple tools for queue and spam check without dependencies

# Usage:
1. Throw `queue.js` in your project
2. include it:
```
const queueAPI = require('./queue');

const Queue = new queueAPI({
 timeout   : 100,       // optional | Number  | Default : 34
 msgCount  : 2,         // optional | Number  | Default : 1
 cleanTime : 10000,     // optional | Number  | Default : 60000
 queue     : [],        // optional | Array   | Default : []
 users     : new Map(), // optional | Map     | Default : new Map()
 DEBUG     : true       // optional | Boolean | Default : false
});
```

## Methods:
#### setUser(id, wait)

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
  // setup user, if no local found
  if (!Queue.getUser(ctx.id)) Queue.setUser(ctx.id, false);
  
  // check if user exists in map and need reply
  if (Queue.getUser(ctx.id) && !Queue.getUser(ctx.id).wait) {
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

### bulk send with { timeout : 400, msgCount : 2 }
![](https://media.giphy.com/media/cnX5TzXRpxVhM14YpX/giphy.gif)

### spam test
![](https://media.giphy.com/media/W4iDep0iNEq8sdjhCa/giphy.gif)
