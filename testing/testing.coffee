EK = require "../dist/enocean2sensor.js"

client = require("sensor-client")("http://localhost:5080/event")

lights = {
  "00:11:22:33": EK.dimmableLight("room1", "lamp1")
}

handler = EK.init { client, lights }

telegram = EK.EnoceanTelegram
  .create("00:11:22:33")
  .set(8, 100)

handler.sentData telegram
