var express = require("express");
var bodyParser = require("body-Parser")
var app = express();

app.use(express.static("/Users/davidmitchell/Desktop/GO"));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.listen(8000, function() {
    console.log("Express is currently running.");
});

app.post("/newGame", function(req,res,next) {
    console.log("Received request for new game", JSON.stringify(req.body));
    res.write("Game #2");
    res.end();
    next();
});

app.post("/move", function(req,res,next) {
    console.log("Received turn", JSON.stringify(req.body));
    res.write("Received");
    res.end();
    next();
});
