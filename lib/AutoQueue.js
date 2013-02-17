var winston = require('winston');
var amqp = require('amqp');

var Queue = require('./Queue');
var RabbitManager = require('./RabbitManager');

var AutoQueue = function(rabbitOptions) {
    this.connectionInfo = rabbitOptions.connection;
    this.exchangeOptions = rabbitOptions.exchange;
    this.publishOptions = rabbitOptions.publish;
  };

var connectToBroker = function(connectionInfo, callback) {
    winston.info('Connecting to broker.');
    var connection = amqp.createConnection(connectionInfo);
    connection.on('ready', function() {
      winston.info('Broker connection ready.');
      callback(null, connection);
    });
    connection.on('error', function() {
      winston.warn('Broker connection error.');
      callback(new Error('Broker connection error.'), connection);
    });
  };

AutoQueue.prototype.publish = function(id, payload, contentType, callback) {
  if (this.queue) {
    this.queue.publish(id, payload, contentType, callback);
  } else {
    callback(new Error('Queue is not ready yet.'));
  }
};

AutoQueue.prototype.close = function() {
  winston.info('Closing queue.');
  if (this.queue) {
    this.queue.close();
    this.queue = null;
  }

  this.isClosing = true;
};

AutoQueue.prototype.initialize = function(callback) {
  var self = this;
  self.isClosing = false;

  var connect = function() {
      if (self.isClosing) {
        winston.info('Not connecting to the broker because the queue is closing.');
        return;
      }

      connectToBroker.apply(self, [self.connectionInfo, function(err, connection) {
        if (err) {
          self.queue = null;
          setTimeout(function() {
            connect();
          }, 5000);
          return;
        }

        var rabbitManager = new RabbitManager(self.connectionInfo.host, self.connectionInfo.login, self.connectionInfo.password);

        self.queue = new Queue(connection, rabbitManager, self.connectionInfo.vhost, self.exchangeOptions, self.publishOptions);

        connection.on('end', function() {
          winston.info('The connection to the broker has ended.');
        });

        connection.on('error', function(error) {
          winston.warn('There was an error communicating with the broker.', error);
        });

        connection.on('close', function() {
          if (!self.isClosing) {
            winston.warn('The connection to the broker was closed.');
          }
        });

        connection.on('connect', function() {
          winston.info('Connected to broker.');
        });

        self.queue.initialize(function(err) {
          winston.info('Queue initialized.');
          if (callback) {
            callback(err);
          }
        });
      }]);
    };

  connect();
};

module.exports = AutoQueue;
