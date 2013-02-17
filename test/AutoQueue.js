var AutoQueue = require('../lib/AutoQueue');
var amqp = require('amqp');
var RabbitHat = require('rabbit-hat');

describe('AutoQueue:', function() {
  var queue;
  var queueName = "AutoQueueTestQueue";
  var messageFromQueue;
  var baseRabbitOptions = {
    "connection": {
      "host": "localhost",
      "port": 5672,
      "login": "guest",
      "password": "guest"
    },
    "exchange": {
      "name": "AutoQueueTestExchange",
      "options": {
        "durable": true,
        "passive": false
      },
      "queueBindings": {
        "RoutingKey": [queueName]
      }
    },
    "publish": {
      "routingKey": "RoutingKey",
      "deliveryMode": 2
    }
  };

  function subscribeToTestQueue(connection, messageHandler) {

    connection.on('ready', function() {
      var messagesQueue = connection.queue(queueName, {
        durable: true,
        autoDelete: false
      });
      messagesQueue.subscribe({
        ack: true
      }, function(message, headers) {

        messageHandler(headers.id, message.data, message.contentType, function(error) {
          if (error) {
            messagesQueue.currentMessage.reject(true);
          } else {
            messagesQueue.shift();
          }
        });
      });
    });
  }

  describe('on a new virtual host', function() {
    var virtualHost;
    var rabbitOptions;

    function createVirtualHost(done) {
      rabbitOptions = baseRabbitOptions;
      virtualHost = new RabbitHat(rabbitOptions.connection);
      rabbitOptions.connection.vhost = virtualHost.name;
      virtualHost.create(done);
    }

    beforeEach(function(done) {
      createVirtualHost(done);
    });

    afterEach(function(done) {
      virtualHost.destroy(done);
    });

    describe('with a new connection', function() {
      var connection;

      beforeEach(function() {
        connection = amqp.createConnection(baseRabbitOptions.connection);
      });

      afterEach(function() {
        connection.end();
      });

      describe('having subscribed to a queue', function() {

        beforeEach(function() {
          subscribeToTestQueue(connection, function(id, data, contentType, callback) {
            messageFromQueue = {
              "id": id,
              "data": data,
              "contentType": contentType
            };
            callback();
          });
        });

        describe('I create an AutoQueue', function() {

          beforeEach(function(done) {
            queue = new AutoQueue(baseRabbitOptions);
            queue.initialize(done);
          });

          afterEach(function() {
            queue.close();
          });

          it('it should not be null', function() {
            expect(queue).to.be.ok;
          });

          describe('and I publish a message to the queue', function() {

            beforeEach(function(done) {
              queue.publish(3, new Buffer([1, 2, 3, 4, 5]), 'image/png', done);
            });

            it('the message queue should contain one message', function(done) {
              soon(function() {
                expect(messageFromQueue).to.be.ok;
              }, this, done);
            });
          });
        });
      });
    });
  });
});
