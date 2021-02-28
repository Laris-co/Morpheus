const bodyParser = require('body-parser')
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

const pkg = require('./package.json')
const version = pkg.version
const app = express()
const mqtt = require('mqtt')
const basicAuth = require('express-basic-auth')

app.use(express.static('dist'))

// app.use('/react', express.static('react-app/build'))
// app.use(express.static('vue-app/dist'))
app.use(
  basicAuth({
    users: { admin: 'supersecret' },
  })
)
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

app.get('/check', (req, res) => {
  let timer = setTimeout(() => {
    res.status(500).send('timeout')
  }, 4000)

  const MQTT_HOST = process.env.MQTT_HOST
  const MQTT_USERNAME = process.env.MQTT_USERNAME
  const MQTT_PASSWORD = process.env.MQTT_PASSWORD
  const options = {
    port: 1883,
    clientId: 'mqtt-hc' + Math.random(),
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
  }

  console.log(options, `mqtt://${MQTT_HOST}`)
  const client = mqtt.connect(`mqtt://${MQTT_HOST}`, options)

  client.on('message', (topic, msg) => {
    console.log(topic, msg)
    client.end()
    res.status(200).send(`OK`)
    clearTimeout(timer)
  })

  client.on('connect', () => {
    console.log('connected')
    client.subscribe('#')
  })

  client.on('error', (err) => {
    res.status(500).send(`FAILED: ${err}`)
    clearTimeout(timer)
  })
})

const paths = app._router.stack.filter((v) => v.route).map((v) => v.route.path)

paths.forEach((path, idx) => {
  console.log(`[${idx}] -> ${path}`)
})

// console.log(process.env)
//start app
const port = process.env.PORT || 4000
app.listen(port, () => console.log(`App is listening on port ${port}.`))
