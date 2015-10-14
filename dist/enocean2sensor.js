var Bacon, EnoceanTelegram, dimmableLight, hourly, init, onOffLight, repeated, sendToServer, temperature, withErrorHandling, _;

_ = require("lodash");

EnoceanTelegram = require("./enocean-telegram");

Bacon = require("baconjs");

temperature = function(location, min, max) {
  if (min == null) {
    min = 0;
  }
  if (max == null) {
    max = 40;
  }
  return function(telegram, client) {
    temperature = (255 - telegram.buffer[9]) / 255 * (max - min) + min;
    return sendToServer(client, {
      collection: "sensors",
      type: "temperature",
      location: location,
      value: temperature,
      device: telegram.enoceanAddress()
    });
  };
};

dimmableLight = function(group, name) {
  return repeated(function(telegram, client) {
    var brightness;
    brightness = telegram.buffer[8];
    return sendToServer(client, {
      collection: "lights",
      type: "brightness",
      location: group,
      light: name,
      brightness: brightness,
      device: telegram.enoceanAddress()
    });
  });
};

onOffLight = function(group, name) {
  return repeated(function(telegram, client) {
    var brightness;
    brightness = telegram.buffer[9] * 100;
    return sendToServer(client, {
      collection: "lights",
      type: "brightness",
      location: group,
      light: name,
      brightness: brightness,
      device: telegram.enoceanAddress()
    });
  });
};

hourly = 3600 * 1000;

repeated = function(fn) {
  var bus;
  bus = new Bacon.Bus;
  bus.throttle(1000).flatMapLatest(function(x) {
    return Bacon.once(x).merge(Bacon.interval(hourly, x));
  }).onValues(fn);
  return function(telegram, client) {
    return bus.push([telegram, client]);
  };
};

sendToServer = function(client, event) {
  console.log("Sending to server", event);
  return client.send(event).then(function() {
    return console.log("Sent");
  })["catch"](function(err) {
    return console.log("Error", err);
  });
};

withErrorHandling = function(f) {
  return function() {
    var e;
    try {
      return f.apply(this, arguments);
    } catch (_error) {
      e = _error;
      return console.log("******* ERROR *******", e);
    }
  };
};

init = function(_arg) {
  var client, lights, receivedData, sensors, sentData;
  client = _arg.client, lights = _arg.lights, sensors = _arg.sensors;
  receivedData = withErrorHandling(function(data) {
    var handler, telegram;
    telegram = new EnoceanTelegram(data);
    if (telegram.is4bs()) {
      handler = sensors != null ? sensors[telegram.enoceanAddress()] : void 0;
      if (handler) {
        return handler(telegram, client);
      } else {
        return console.log("got data from unknown sensor", telegram.toString());
      }
    }
  });
  sentData = withErrorHandling(function(data) {
    var handler, telegram;
    telegram = new EnoceanTelegram(data);
    handler = lights != null ? lights[telegram.enoceanAddress()] : void 0;
    if (handler) {
      return handler(telegram, client);
    } else {
      return console.log("sent data to unknown device", telegram.toString());
    }
  });
  return {
    receivedData: receivedData,
    sentData: sentData
  };
};

module.exports = {
  init: init,
  onOffLight: onOffLight,
  dimmableLight: dimmableLight,
  temperature: temperature,
  EnoceanTelegram: EnoceanTelegram
};
