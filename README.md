# autoqueue

Helps AMQP publishers keep their bindings up.

In some cases it's useful to be able to switch application features on and off by
creating and deleting queues. This module simplfies the publisher's job in this
situation by making sure bindings are re-applied when the queue is recreated.

## Installation

No surprises here:

    npm install autoqueue

## Usage

### Constructor

    var myAutoQueue = new AutoQueue(connectionInfo)

Creates a new AutoQueue object (no, really!) with connection information like this:

    var connectionInfo = {
      "connection": {
        "host": "localhost",
        "port": 5672,
        "vhost": "MyVirtualHost",
        "login": "guest",
        "password": "guest"
      },
      "exchange": {
        "name": "MyExchange",
        "options": {
          "durable": true,
          "passive": false
        },
        "queueBindings": {
          "MyRoutingKey": ["MyQueue"]
        }
      },
      "publish": {
        "routingKey": "MyRoutingKey",
        "deliveryMode": 2
      }
    };

In this example, AutoQueue will connect to `MyVirtualHost` on the local machine with
default credenitals. The `publish` method will send messages to `MyExchange` with
`MyRoutingKey`, and it will make sure that if `MyQueue` exists then it will receive them.

You can add more entries to `queueBindings` and your message will be sent to more
queues if they are present.

### initialize

    myAutoQueue.initialize(callback)

Makes the connection and performs initial binding if the queue is present.

### publish

    myAutoQueue.publish(id, payload, contentType, callback)

Publishes a message to the exchange.

### close

    myAutoQueue.close()

Closes all connections.
