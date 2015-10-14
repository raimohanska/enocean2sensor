## enocean2sensor

Send data from your enocean-devices to [sensor-server](https://github.com/raimohanska/sensor-server)

You need to install [sensor-client](https://github.com/raimohanska/sensor-client):

    npm install raimohanska/sensor-client

Then something like this will work

```coffeescript
ES = require("enocean2sensor")

sensors = {
  "02:55:65:a3": (telegram, client) -> console.log "custom handler", telegram.toString()
  "21:81:55:a3": ES.temperature("inside", 0, 40)
}

lights = {
  "aa:8e:12:82": ES.dimmableLight("livingroom", "reading lamp")
  "f0:3e:43:81": ES.dimmableLight("livingroom", "ceiling lamp")
  "3e:41:ff:55": ES.onOffLight("kitchen", "ceiling lamp")
}

client = require("sensor-client")("http://localhost:5080/event")

enoceanHandler = ES.init { client, lights, sensors }
```

The `enoceanHandler` returned by `ES.init` has methods `receivedData` and `sentData` that can handle incoming and outgoing enocean telegrams respectively. Each method consumes a Buffer of enocean data.

I'm using this in combination with my [Huom.IO](http://houm.io/) setup.
