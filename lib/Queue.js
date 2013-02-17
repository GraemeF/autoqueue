var async = require('async');
var _ = require('underscore');
var winston = require('winston');

var Queue = function(connection, rabbitManager, vhost, exchangeOptions, publishOptions) {
    this.vhost = vhost;
    this.exchangeOptions = exchangeOptions;
    this.publishOptions = publishOptions;
    this.connection = connection;
    this.rabbitManager = rabbitManager;
  };

Queue.prototype.initialize = function(callback) {
  var self = this;

  function exchangeReady(exchange) {
    winston.info('Found exchange.');
    async.forEach(_.keys(self.exchangeOptions.queueBindings), function createRoutingKeyBindings(routingKey, callback) {
      async.forEach(self.exchangeOptions.queueBindings[routingKey], function(queue, callback) {
        self.rabbitManager.bindQueueToExchange(self.vhost, queue, self.exchangeOptions.name, routingKey, callback);
      }, callback);
    }, function(err) {
      winston.info('Exchange is ready for messages.');
      self.exchange = exchange;
      callback(err);
    });
  }

  winston.info('Locating exchange.');
  self.connection.exchange(self.exchangeOptions.name, self.exchangeOptions.options, exchangeReady);
};

Queue.prototype.publish = function(id, payload, contentType, callback) {
  if (this.exchange) {
    this.exchange.publish(this.publishOptions.routingKey, payload, {
      deliveryMode: this.publishOptions.deliveryMode,
      contentType: contentType,
      headers: {
        id: id
      }
    });
    callback();
  } else {
    callback(new Error('Exchange is not ready yet.'));
  }
};

Queue.prototype.close = function() {
  this.connection.end();
};

module.exports = Queue;
