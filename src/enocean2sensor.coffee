_ = require "lodash"
EnoceanTelegram = require "./enocean-telegram"
Bacon = require "baconjs"

temperature = (location, min = 0, max = 40) -> (telegram, client) ->
  temperature = (255 - telegram.buffer[9]) / 255 * (max - min) + min
  sendToServer client,
    { collection: "sensors", type: "temperature", location: location, value: temperature, device: telegram.enoceanAddress() }

dimmableLight = (group, name) -> repeated (telegram, client) ->
  brightness = telegram.buffer[8]
  sendToServer client,
    { collection: "lights", type: "brightness", location: group, light: name, brightness, device: telegram.enoceanAddress() }

onOffLight = (group, name) -> repeated (telegram, client) ->
  brightness = telegram.buffer[9] * 100
  sendToServer client,
    { collection: "lights", type: "brightness", location: group, light: name, brightness, device: telegram.enoceanAddress() }

hourly=3600 * 1000
repeated = (fn) ->
  bus = new Bacon.Bus
  bus
    .throttle(1000)
    .flatMapLatest (x) -> Bacon.once(x).merge(Bacon.interval(hourly, x))
    .onValues fn
  (telegram, client) -> bus.push [telegram, client]

sendToServer = (client, event) ->
  console.log "Sending to server", event
  client.send(event)
    .then -> console.log "Sent"
    .catch (err) -> console.log "Error", err

withErrorHandling = (f) -> () ->
  try
    f.apply(this, arguments)
  catch e
    console.log "******* ERROR *******", e


init = ({ client, lights, sensors}) ->
  receivedData = withErrorHandling (data) ->
    telegram = new EnoceanTelegram(data)
    if telegram.is4bs()
      handler = sensors?[telegram.enoceanAddress()]
      if handler
        handler(telegram, client)
      else
        console.log "got data from unknown sensor", telegram.toString()

  sentData = withErrorHandling (data) ->
    telegram = new EnoceanTelegram(data)
    handler = lights?[telegram.enoceanAddress()]
    if handler
      handler(telegram, client)
    else
      console.log "sent data to unknown device", telegram.toString()
  { receivedData, sentData }

module.exports = { init, onOffLight, dimmableLight, temperature, EnoceanTelegram }
