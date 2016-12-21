const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

mongoose.Promise = global.Promise;

const {Story} = require('./models');

const DATABASE_URL = process.env.DATABASE_URL ||
                     global.DATABASE_URL ||
                     'mongodb://localhost/hn-api';
const PORT = process.env.PORT || 8080;

const app = express();
app.use(bodyParser.json());

app.get('/stories', (req, res) => {
    Story
        .find()
        .sort({
            votes: -1
        })
        .limit(20)
        .exec()
        .then(stories =>
            res.json(stories.map(story => story.apiRepr()))
        )
        .catch(err => {
            console.error(err);
            res.status(500).json({message: 'Internal server error'});
        });
});

app.post('/stories', (req, res) => {
    const requiredFields = ['title', 'url'];
    const missingField = requiredFields.find(field =>
        !(field in req.body && req.body[field])
    );

    if (missingField) {
        return res.status(400).json({
            message: `Must specify value for ${missingField}`
        });
    }

    Story
        .create({
            title: req.body.title,
            url: req.body.url
        })
        .then(story => res.status(201).json(story.apiRepr()))
        .catch(err => {
            console.error(err);
            res.status(500).json({message: 'Internal server error'});
        });
});

app.put('/stories/:id', (req, res) => {
    Story
        .findByIdAndUpdate(req.params.id, {
            $inc: {votes: 1}
        })
        .exec()
        .then(story => res.status(204).end())
        .catch(err => {
            console.error(err);
            res.status(500).json({message: 'Internal server error'});
        });
});

let server;
function runServer() {
  return new Promise((resolve, reject) => {
    mongoose.connect(DATABASE_URL, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(PORT, () => {
        console.log(`Your app is listening on port ${PORT}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
     return new Promise((resolve, reject) => {
       console.log('Closing server');
       server.close(err => {
           if (err) {
               return reject(err);
           }
           resolve();
       });
     });
  });
}

if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {app, runServer, closeServer};
