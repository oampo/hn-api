const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const faker = require('faker');

const should = chai.should();

const {app, runServer, closeServer} = require('../server');
const {Story} = require('../models');


chai.use(chaiHttp);

function generateStory() {
    return {
        title: faker.lorem.words(),
        url: faker.internet.url()
    };
}

function seedData() {
    console.info('Seeding data');
    const stories = [];
    for (var i=0; i<10; i++) {
        stories.push(generateStory());
    }
    return Story.insertMany(stories);
}

function tearDownDb() {
  console.info('Deleting database');
  return mongoose.connection.dropDatabase();
}

describe('Hacker News API', function() {
    before(function() {
        return runServer();
    });

    beforeEach(function() {
        return seedData();
    });

    afterEach(function() {
        return tearDownDb();
    });

    after(function() {
        return closeServer();
    })

    describe('GET /stories', function() {
        it('should return the list of stories', function() {
            let res;
            return chai.request(app)
                .get('/stories')
                .then(function(_res) {
                    res = _res;
                    res.should.have.status(200);
                    res.body.should.have.length.of.at.least(1);
                    res.body.forEach(story => {
                        story.should.be.an('object');
                        story.should.have.a.property('id');
                        story.should.have.a.property('title');
                        story.should.have.a.property('url');
                        story.should.have.a.property('votes');
                    });
                    return Story.find();
                })
                .then(function(stories) {
                    res.body.should.have.length.of(stories.length);
                    stories.forEach((story, index) => {
                        res.body[index].id.should.equal(story.id);
                        res.body[index].title.should.equal(story.title);
                        res.body[index].url.should.equal(story.url);
                        res.body[index].votes.should.equal(story.votes);
                    });
                });
        });
    });

    describe('POST /stories', function() {
        it('should add a story', function() {
            const story = generateStory();
            return chai.request(app)
                .post('/stories')
                .send(story)
                .then(function(res) {
                    res.should.have.status(201);
                    res.body.should.be.an('object');
                    res.body.should.have.a.property('id');
                    res.body.should.have.a.property('title');
                    res.body.should.have.a.property('url');
                    res.body.should.have.a.property('votes');
                    res.body.title.should.equal(story.title);
                    res.body.url.should.equal(story.url);
                    res.body.votes.should.equal(0);
                    return Story.findById(res.body.id);
                })
                .then(function(dbStory) {
                    dbStory.title.should.equal(story.title);
                    dbStory.url.should.equal(story.url);
                    dbStory.votes.should.equal(0);
                });
        });
    });

    describe('PUT /stories/:idd', function() {
        it('should increment a story\'s votes', function() {
            let story;
            return Story.findOne()
                .then(_story => {
                    story = _story;
                    return chai.request(app)
                        .put(`/stories/${story._id}`);
                })
                .then(function(res) {
                    res.should.have.status(204);
                    res.body.should.be.empty;
                    return Story.findById(story._id);
                })
                .then(function(dbStory) {
                    dbStory.title.should.equal(story.title);
                    dbStory.url.should.equal(story.url);
                    dbStory.votes.should.equal(story.votes + 1);
                });
        });
    });
});
