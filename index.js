const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')
const mongoose = require('mongoose')
require('dotenv').config()

const mySecret = process.env['MONGO_URI']

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('tiny'))

mongoose.connect(
  mySecret,
  { useNewUrlParser: true }
)

let userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
})

let Users = mongoose.model('Users', userSchema)

let exerSchema = mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  date: String,
  userId: {
    type: String,
    required: true,
  },
})

let Exercises = mongoose.model('Exercises', exerSchema)

app.route('/api/users')
  .post(async (req, res) => {
    let { username } = req.body
    console.log(username, req.body)
    await Users.create(
      {
        username,
      },
      (err, data) => {
        if (err) return console.log(err)
        res.json(data)
      }
    )
    try {
    } catch (error) {
      console.log(error)
      res.send(error)
    }
  })
  .get(async (req, res) => {
    try {
      await Users.find().exec((err, data) => {
        if (err) return console.log(err)
        res.json(data)
      })
    } catch (error) {
      console.log(error)
      res.send(error)
    }
  })

app.route('/api/users/:_id/exercises').post(async (req, res) => {
  try {
    let { _id } = req.params
    console.log(req.body)

    let { description, duration, date } = req.body
    let durTime = parseInt(duration)

    let exerLogs = []
    await Users.findOne({ _id }, (err, data) => {
      if (err) return console.log(err)
      console.log(data)
      // exerLogs = data.logs
      let inDate
      if (date) {
        inDate = new Date(date)
      } else {
        inDate = new Date()
      }
      inDate = inDate.toDateString()
      console.log(`Date: ${inDate}`)
      // exerLogs.push({ description, duration, date: inDate })
      // console.log({ description, duration, date })
      // Users.findOneAndUpdate(
      //     { _id },
      //     { $set: { logs: exerLogs } },
      //     { new: true },
      //     (err, data) => {
      //         if (err) return console.log(err)
      //         console.log(data)
      //         res.json(data)
      //     }
      // )
      Exercises.create(
        {
          description,
          duration,
          date: inDate,
          userId: data._id,
        },
        (error, newData) => {
          if (error) return console.log(error)
          console.log(newData)

          let { username, _id } = data
          let { duration, description, date } = newData
          res.json({
            username,
            _id,
            description,
            duration,
            date,
          })
        }
      )
    })
  } catch (error) {
    console.log(error)
  }
})

app.route('/api/users/:_id/logs').get(async (req, res) => {
  try {
    console.log(req.query)
    let { from, to, limit } = req.query
    from = new Date(from)
    to = new Date(to)
    let { _id } = req.params
    await Users.findOne({ _id }, (err, data) => {
      if (err) return console.log(err)
      console.log(data)
      Exercises.find({ userId: _id, dateField: { $gte: from, $lte: to } })
        .limit(limit)
        .select('-userId -_id')
        .exec((errors, logs) => {
          console.log(data)
          if (errors) return console.log(errors)
          console.log(logs)
          res.json({
            username: data.username,
            _id: data._id,
            count: logs.length,
            log: logs,
          })
        })
    })
  } catch (error) {
    console.log(error)
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
