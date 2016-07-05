var express = require('express');
var bodyParser = require('body-parser');
var sessions = require('client-sessions');
var mongodb = require('mongodb');
var app = express();

//use body parser for handling json objects
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//make the public folder available to navigate to
app.use(express.static('./public'));

//enable cookies for session tracking
app.use(sessions({
    cookieName: 'session',
    secret: 'sh',
    duration: 60*1000,
    activeDuration: 0
}));

//connect with mongoclient
var MongoClient = mongodb.MongoClient;
var url = "mongodb://localhost:27017/mydb";

//redirect requests to the login page
app.get('/', function(req,res) {
    res.redirect('/login.html');
});

//user selects to play AI
//if logged in route to gamepage else route to login
app.post('/playAIB', function(req, res) {
    if (req.session && req.session.user){
            console.log("Session active: directing " + req.session.user.username + " to gamepage");
            res.write(JSON.stringify({redirect: '/gamepage.html'}));
            res.end();

    }
    else {
        console.log("No session active: directing to login");
        res.write(JSON.stringify({redirect: 'noSession'}));
        res.end();
    }
});

//user attempts to login
app.post('/login', function(req,res) {
    //write login attempt to console
    console.log("Received login post");
    console.log("Username is " + req.body.username);
    console.log("Password is "+ req.body.password);
    //store user as submitted username and password
    var user = {'username': req.body.username, 'password': req.body.password};

    MongoClient.connect(url, function(err,db) {
        if (err) {
            console.log("Couldn't connect to database");
            db.close();
        }
        else {
            db.collection('users').findOne({'username': user.username}, function (err, results) {
                if (err) {
                    console.log(err);
                //if user doesn't exist, prompt invalid login
                } else if (results == null) {
                    console.log("Invalid login");
                    res.write(JSON.stringify({redirect: 'invalidLogin'}));
                } else {
                    //if username and password match, store session and direct to gamepage
                    if (results.password == user.password) {
                        console.log('Logged in ' + user.username + ' and redirected to gamepage');
                        req.session.user = user;
                        res.write(JSON.stringify({redirect: '/gamepage.html'}));
                    }
                    else {
                        //if username doesn't match password, prompt invalid login
                        console.log("Invalid login");
                        res.write(JSON.stringify({redirect: 'invalidLogin'}));
                    }
                }

                //close response and database
                res.end();
                db.close();
            });
        }
    });
});

//user attempts to sign up
app.post('/signUp', function(req,res) {

    //log sign up attempt to console
    console.log("Received sign up post");
    console.log("Username is " + req.body.username);
    console.log("Password is "+ req.body.password);

    //store submitted username and password as user
    var user = {'username': req.body.username, 'password': req.body.password};
    MongoClient.connect(url, function(err,db) {
        if (err) {
            console.log("Couldn't connect to database");
            db.close();
        }
        else {
            db.collection('users').findOne({'username': user.username}, function (err, results){
                if (err) {
                    console.log(err);
                    db.close();
                // if username is not taken, create in database, store session, direct to gamepage
                } else if (results == null) {
                    db.collection('users').insertOne(user, function (err, results) {
                        if (err) {
                            console.log(err);
                            db.close();
                        } else {
                            console.log("Inserted user " + user.username + " " + results);
                            req.session.user = user;
                            res.write(JSON.stringify({redirect: '/gamepage.html'}));
                            res.end();
                            db.close();
                        }
                    });
                //if username is taken, prompt user
                } else {
                    console.log("Invalid sign up name");
                    res.write(JSON.stringify({redirect: 'invalidUsername'}));
                    res.end();
                    db.close();

                }
            });
        }
    });
});

app.listen(8000, function() {
    console.log("Listening on port 8000");
});
