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

app.get('/ss', async (req, res) => {
  const { SecretManagerServiceClient } = require('@google-cloud/secret-manager')
  const client = new SecretManagerServiceClient()

  const name = 'projects/laris-co-playground/secrets/yeeha/versions/1'

  async function getSecret() {
    const [secret] = await client.getSecret({
      name: name,
    })

    const policy = secret.replication.replication

    console.info(`Found secret ${secret.name} (${policy})`)
  }

  const parent = 'projects/laris-co-playground'

  async function listSecrets() {
    const [secrets] = await client.listSecrets({
      parent: parent,
    })

    secrets.forEach((secret) => {
      const policy = secret.replication.userManaged
        ? secret.replication.userManaged
        : secret.replication.automatic
      console.log(`${secret.name} (${policy})`, policy)
    })
  }

  await listSecrets().catch((err) => {
    console.error(err)
  })
  await getSecret().catch((err) => {
    console.error(err)
  })

  res.status(200).send('done')
})

app.get('/check', (req, res) => {
  let timer = setTimeout(() => {
    res.status(500).send('timeout')
  }, 4000)

  const options = {
    port: 1883,
    clientId: 'mqtt-hc' + Math.random(),
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
  }

  const mqttClient = mqtt.connect(`mqtt://${MQTT_HOST}`, options)
  let done = false

  mqttClient.on('message', (topic, msg) => {
    if (done) return
    done = true
    console.log(topic, msg)
    mqttClient.end()
    res.status(200).send(`OK`)
    clearTimeout(timer)
  })

  mqttClient.on('connect', () => {
    console.log('connected')
    mqttClient.subscribe('#')
  })

  mqttClient.on('error', (err) => {
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
