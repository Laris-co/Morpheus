const bodyParser = require('body-parser')
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

const pkg = require('./package.json')
const version = pkg.version
const app = express()
const mqtt = require('mqtt')

app.use(express.static('dist'))

// app.use('/react', express.static('react-app/build'))
// app.use(express.static('vue-app/dist'))
app.use(basicAuth({
    users: { 'admin': 'supersecret' }
}))
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(morgan('dev'))

app.get('/api', (req, res) => {
  res.status(200).send(`Welcome to webapp-starter api v${version}`)
})

app.get('/api/version', (req, res) => {
  res.status(200).send(`${version}`)
})

app.get("/check", (req, res) => {
  const MQTT_HOST = process.env.MQTT_HOST || 'dummy-id';
  console.log(MQTT_HOST)
  res.status(200).send(`check ${version}`)
})
  // const client = mqtt.connect(`tcp://:1883`, {
  //   clientId: 'mqtt-healthcheck'
  // })

  // client.on('message', (topic, msg) => {
  //   console.log(topic, msg)
  // })

  // client.on('connect', () => {
  //   console.log('connected')
  //   client.subscribe("#")
  // })

const paths = app._router.stack.filter((v) => v.route).map((v) => v.route.path)

paths.forEach((path, idx) => {
  console.log(`[${idx}] -> ${path}`)
})

// console.log(process.env)
//start app
const port = process.env.PORT || 4000
app.listen(port, () => console.log(`App is listening on port ${port}.`))
