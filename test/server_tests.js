"use strict";
const assert = require('assert');
const server = require('../server');
const request = require('supertest')(server);
const User = require('../User');
const superagent = require('superagent');
const session = require('supertest-session');
const AIInterface = require('../ai/AIInterface');



describe('POST:/signUp signs up user with username/password', function() {
    it('Should not allow empty username and password', function(done) {
        request
            .post('/signUp')
            .send({})
            .expect(400)
            .end(function(err, res) {
                assert(!err);
                done();
            })
    });
    it('Should not allow empty username', function(done) {
        request
            .post('/signUp')
            .send({password: 'bla'})
            .expect(400)
            .end(function(err, res) {
                assert(!err);
                done();
            })
    });
    it('Should not allow empty password', function(done) {
        request
            .post('/signUp')
            .send({username: 'bla'})
            .expect(400)
            .end(function(err, res) {
                assert(!err);
                done();
            })
    });
    const randomString = Math.random().toString(36);
    it('Should allow a new username/password', function(done) { 
        request
            .post('/signUp')
            .send({username: randomString, password: randomString}) // NOTE: small chance the random string already exists
            .expect(200)
            .end(function(err, res) {
                assert(!err);

                let resData = JSON.parse(res.text);
                assert(resData.redirect == '/gamepage.html');
                assert(resData.login == 'yes');
                assert(resData.status == 'OK');

                User.findOne({username: randomString, password: randomString}).exec(function(err, user) {
                    assert(!err && user);
                    assert(user.username == randomString);
                    assert(user.password == randomString);
                    done();
                })

            })
    });

    it('Should let us login with that username/password', function(done) {
        request
            .post('/login')
            .send({username: randomString, password: randomString})
            .expect(200)
            .end(function(err, res) {
                assert(!err);
                let resData = JSON.parse(res.text);
                assert(resData.redirect == '/gamepage.html');
                assert(resData.login == 'yes');
                assert(resData.status == 'OK');
                done();
            })
    });

});

describe('POST:/login should login username/password', function() {
    it('should let us login to guest account', function(done) {
        request
            .post('/login')
            .send({username: 'guest', password: 'guest'})
            .expect(200)
            .end(function(err, res) {
                assert(!err);
                let resData = JSON.parse(res.text);
                assert(resData.redirect == '/gamepage.html');
                assert(resData.login == 'yes');
                assert(resData.status == 'OK');
                done();
            });
    });
    it('should not let us login to unregistered user', function(done) {
        request
            .post('/login')
            .send({username: 'MrNotUserFace912912', password: 'lalalllala123'}) // assuming doesnt exist for test case
            .expect(200)
            .end(function(err, res) {
                assert(!err);
                let resData = JSON.parse(res.text);
                assert(resData.redirect == '');
                assert(resData.login == 'no');
                assert(resData.status == 'invalidLogin');
                done();
            });
    });
});

describe('GET:/ should redirect to login.html', function() {
    it('Should respond', function(done) {
        request
            .get('/')
            .expect(302)
            .end(function(err, res) {
                assert(!err);
                done();
            })
    });
});

function login(request, done) {
    agent
        .post('/login')
        .send({ username: 'guest', password: 'guest' })
        .end(function(err, res) {
            if (err) throw err;
        })
}



describe('POST:/newGame creates a new game in the database', function() {
    it('should respond with status 400 if user not logged in and no post data', function(done) {
        request
            .post('/newGame')
            .expect(400)
            .end(function(err, res) {
                assert(!err);
                done();
            });
    });
    it('should respond with status 400 if user not logged in', function(done) {
        request
            .post('/newGame')
            .send({size: 19, hotseat: false})
            .expect(400)
            .end(function(err, res) {
                assert(!err);
                done();
            });
    });

});

describe('Gameplay: AI vs AI test', function() {
    var testSession = session(server);

    it('should sign in', function (done) {
        testSession.post('/login')
            .send({ username: 'guest', password: 'guest' })
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                done();
            });
    });
    
     it('should not allow post to /newGame with size < 3', function (done) {
        testSession.post('/newGame')
            .send({size: 2, hotseat: false})
            .expect(400)
            .end(function(err, result) {
                if (err) throw err;
                done()
            })
    });

    it('should allow post to /newGame', function (done) {
        testSession.post('/newGame')
            .send({size: 5, hotseat: false})
            .expect(200)
            .end(function(err, result) {
                if (err) throw err;
                done()
            })
    });

    var game;
    var clientColor = 1;
    var lastMove = {}
    it('should allow get to /game', function (done) {
        testSession.get('/game')
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                game = res.body
                done();
            })
    });

    it('should allow client move', function(done) {
        lastMove.color = clientColor;
        lastMove.x = 0;
        lastMove.y = 0;
        lastMove.pass = false;
        testSession.post('/game/makeClientMove')
            .send({x: lastMove.x, y: lastMove.y, pass: lastMove.pass})
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                debugger;
                game = res.body;
                assert(res.body.hasOwnProperty('x'));
                assert(res.body.hasOwnProperty('y'));
                assert(res.body.hasOwnProperty('color'));
                assert(res.body.hasOwnProperty('pass'));
                assert(res.body.hasOwnProperty('capturedPieces'));
                assert(res.body.hasOwnProperty('board'));
                assert(res.body.hasOwnProperty('whiteScore'));
                assert(res.body.hasOwnProperty('blackScore'));
                assert(res.body.hasOwnProperty('whiteTime'));
                assert(res.body.hasOwnProperty('blackTime'));
                done();
            })
    });
    
    it('/game/longpoll should have response', function(done) {
        testSession.get('/game/longpoll')
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                assert(res.body.hasOwnProperty('x') || res.body.pass == true);
                assert(res.body.hasOwnProperty('y') || res.body.pass == true);
                assert(res.body.hasOwnProperty('color'));
                assert(res.body.hasOwnProperty('pass'));
                assert(res.body.hasOwnProperty('capturedPieces'));
                assert(res.body.hasOwnProperty('board'));
                assert(res.body.hasOwnProperty('whiteScore'));
                assert(res.body.hasOwnProperty('blackScore'));
                assert(res.body.hasOwnProperty('whiteTime')); 
                assert(res.body.hasOwnProperty('blackTime')); 
                game = res.body;
                done();
            });
    });
    
    it('should not allow client move to occupied space', function(done) {
        testSession.post('/game/makeClientMove')
            .send({x: 0, y: 0, pass: false})
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                assert.equal(res.text, 'Occupied Place.');
                assert.equal(Object.keys(res.body).length, 0);
                done();
            });
    }); 
    
    it('should allow client move', function(done) { 

        let x = Math.floor(Math.random() * 4)
        let y = Math.floor(Math.random() * 4)
        testSession.post('/game/makeClientMove') // small chance this is occupied
            .send({x: x, y: y, pass: false})
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                done();
            })
    });
    
    it('/game/longpoll should have response', function(done) {
        testSession.get('/game/longpoll')
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                done();
            })
    });

    it('should allow client pass', function(done) { // occupied???
        testSession.post('/game/makeClientMove')
            .send({x: 3, y: 3, pass: true})
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                done();
            })
    });

    it('/game/longpoll should have response', function(done) {
        this.timeout(35 * 1000)
        testSession.get('/game/longpoll')
            .expect(200) // if game is over should pass else shouldnt
            .end(function(err, res) {
                if (err) throw err;
                assert(res.body.hasOwnProperty('winner'));
                assert(res.body.hasOwnProperty('whiteScore'));
                assert(res.body.hasOwnProperty('blackScore'));
                done();
            })
    }); 
});    