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
const encrypted = require('@dtinth/encrypted')()
const MQTT_HOST = process.env.MQTT_HOST
const MQTT_USERNAME = process.env.MQTT_USERNAME
const MQTT_PASSWORD = process.env.MQTT_PASSWORD
const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD

// app.use('/react', express.static('react-app/build'))
// app.use(express.static('vue-app/dist'))
app.use(
  basicAuth({
    users: { [`${BASIC_AUTH_USERNAME}`]: BASIC_AUTH_PASSWORD },
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

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager')

app.get('/check', (req, res) => {
  // Instantiates a client
  const client = new SecretManagerServiceClient()

  async function getSecret() {
    const [secret] = await client.getSecret({ name: 'yeeha' })
    const policy = secret.replication.replication

    console.info(`Found secret ${secret.name} (${policy})`)
  }

  getSecret()
  let timer = setTimeout(() => {
    res.status(500).send('timeout')
  }, 4000)

  const options = {
    port: 1883,
    clientId: 'mqtt-hc' + Math.random(),
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
  }
  // export ENCRYPTION_SECRET=`openssl rand -base64 32`
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
