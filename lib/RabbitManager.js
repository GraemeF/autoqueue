var request = require('request');
var winston = require('winston');

var RabbitManager = function(host, login, password) {
    this.baseUri = 'http://' + login + ':' + password + '@' + host + ':55672/api/';
  };

RabbitManager.prototype.getBindingUri = function(vhost, queue, exchange, routingKey) {
  return this.baseUri + "bindings/" + vhost + "/e/" + exchange + "/q/" + queue + "/" + routingKey;
};

RabbitManager.prototype.bindQueueToExchange = function(vhost, queue, exchange, routingKey, callback) {
  winston.info('Binding ' + queue + ' to ' + exchange + ' on ' + vhost + '.');
  request.put({
    uri: this.getBindingUri(vhost, queue, exchange, routingKey),
    json: {}
  }, function(e, r) {
    if (e) {
      winston.warn('Unable to bind queue to exchange: ' + e);
    } else {
      if (r.statusCode >= 400) {
        return callback(new Error(r.body.reason));
      }
      winston.info('Bound queue ' + queue + ' to exchange ' + exchange + ' with routing key ' + routingKey);
    }
    callback(e, r);
  });
};

RabbitManager.prototype.getQueueArgument = function(vhost, queueName, argument, callback) {
  request.get(this.baseUri + 'queues/' + vhost + '/' + queueName, function(error, res) {
    if (error) {
      return callback(error);
    }

    var value = JSON.parse(res.body)['arguments'][argument];
    if (value) {
      callback(null, value);
    } else {
      callback(new Error('Argument "' + argument + '" was not found on the ' + queueName + ' queue.'));
    }
  });
};

module.exports = RabbitManager;
