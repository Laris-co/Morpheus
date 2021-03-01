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
const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager')
const client = new SecretManagerServiceClient()
async function accessSecretVersion() {
  const name = 'projects/laris-co-playground/secrets/yeeha/versions/latest'
  const [version] = await client.accessSecretVersion({
    name: name,
  })
  return version
}

function mqttFactory(host, options) {
  return new Promise((resolve, reject) => {
    const mqttClient = mqtt.connect(`mqtt://${host}`, options)
    let topic = 'heartbeat/hc'
    mqttClient.subscribe(topic)

    let timer = setTimeout(() => {
      reject(`Timeout: ${host}:${options.port}`)
    }, 4000)

    mqttClient.on('error', (err) => {
      clearTimeout(timer)
      reject(`Failed: ${host}:${options.port}`)
    })

    mqttClient.on('message', (topic, msg) => {
      mqttClient.end()
      clearTimeout(timer)
      resolve(`OK: ${host}:${options.port}`)
    })

    mqttClient.on('connect', () => {
      mqttClient.publish(topic, host)
    })
  })
}

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
  try {
    let version = await accessSecretVersion()
    const payload = version.payload.data.toString()
    console.info(`Payload: ${payload}`, typeof payload)
    let array = JSON.parse(payload)
    console.log(array, typeof array, array.toString())
    Promise.all(array.map((p) => mqttFactory(p.host, p))).then((output) => {
      console.log(output)
      res.status(200).json(output)
    })
  } catch (err) {
    console.error(err)
    res.status(500).send(err)
  }
})

app.get('/check', (req, res) => {})

const paths = app._router.stack.filter((v) => v.route).map((v) => v.route.path)

paths.forEach((path, idx) => {
  console.log(`[${idx}] -> ${path}`)
})

// console.log(process.env)
//start app
const port = process.env.PORT || 4000
app.listen(port, () => console.log(`App is listening on port ${port}.`))
