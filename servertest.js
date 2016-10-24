var express = require('express');
var app = express();
var randomstring = require("randomstring");
var fs = require("fs");
var port  	 = process.env.PORT || 8080;
var mongoose = require('mongoose'); 
var database = require('./config/database'); 			// load the database config
var morgan   = require('morgan');
var methodOverride = require('method-override');
var datani;
var indatabase;
var indatabaselesnaam;
var bodyParser = require('body-parser')
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

// configuration ===============================================================
mongoose.connect(database.url); 	// connect to mongoDB database on modulus.io

app.use(express.static(__dirname + '/public')); 		// set the static files location /public/img will be /img for users
app.use(morgan('dev')); // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'})); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request
app.use(function(req, res, next) {
res.header("Access-Control-Allow-Origin", "*");
res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// routes ======================================================================
require('./app/routes.js')(app);



var randomcode = randomstring.generate(7);


console.log(randomcode);
fs.readFile( __dirname + "/" + "lijstje.json", 'utf8', function (err, data) {
datani = JSON.parse( data );
});



app.get('/heeljson', function (req, res) {		 
			res.json( datani);
            console.log(datani);
});

app.get('/zoek/:naam', function (req, res) {

        indatabase = false;
        
        for (var i = 0; i < datani.users.length; i++) {
                

                if (datani.users[i].naam == req.params.naam) {
                    
                    console.log(req.params.naam+" is in de database");   // naam is in database
                    console.log(datani.users[i])    // logs alle lessen
                    indatabase = true;
                    res.json(datani.users[i]);
                    break;
                }
        }
        if(!indatabase)
        {
            console.log("niet in database")
            res.json("niet in database");
        }  // naam niet in database
});

app.get('/zoekles/:naam/:lesnaam', function (req, res) {

        indatabase = false;
        indatabaselesnaam = false;
        
        for (var i = 0; i < datani.users.length; i++) {
                

                if (datani.users[i].naam == req.params.naam) {
                    
                    console.log(req.params.naam+" is in de database");   // naam is in database
                    indatabase = true;
                    
                        for (var x = 0; x < datani.users[i].Lessen.length; x++) {
                            if (datani.users[i].Lessen[x].naam == req.params.lesnaam) {
                                indatabaselesnaam = true;
                                console.log(req.params.lesnaam+" is in de database");
                                console.log(datani.users[i].Lessen[x]); 
                                res.json(datani.users[i].Lessen[x]);
                                break;
                            }
                        }
                    
                    break;
                }
        }
        if(!indatabase)
        {
            console.log("niet in database")
            res.json("niet in database");
        } 
        if(!indatabaselesnaam)
        {
            console.log("les is niet in database")
            res.json("les is niet niet in database");
        } 
        
});


app.post('/update/:naam/:lesnaam', function (req, res) {

        indatabase = false;
        for (var i = 0; i < datani.users.length; i++) {
                

                if (datani.users[i].naam == req.params.naam) {
                    
                    console.log("User is al in database");
                    res.json("User is al in database");
                    console.log(datani.users[i].Lessen)
                    indatabase = true;
                    break;
                }
        }
        if(!indatabase){
            console.log("In de database gestoken");
            var newuser =
            {
                "naam":req.params.naam, 
                  "Lessen" : 
                    [{
                    "naam":req.params.lesnaam,
                        "vragen" : 
                        [{
                          "vraag":"voorbeeldvraag",
                          "id":"0",
                          "probleemvraag":"false"
                        }]
                    }]
            }
            datani.users.push(newuser);
            res.json(datani.users);
        }
});


/*
app.delete('/delete/:naam', function (req, res) {
   // First read existing users.
    
	 
 
});

*/

var server = app.listen(port, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)

});