var express = require('express');
var mongodb = require('mongodb'); 
var database = require('./config/database');
var morgan   = require('morgan');
var randomstring = require("randomstring");
var fs = require("fs");
var methodOverride = require('method-override');
var http = require('http');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);



var bodyParser = require('body-parser')
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

var port  	 = process.env.PORT || 80;

var datani;
var indatabase;
var indatabaselesnaam;
 
//////////////////MONGO WEG VOOR LOKAAL 
// configuration 
var newjson;
var MongoClient = mongodb.MongoClient;
MongoClient.connect(database.url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    console.log('pulling jsonfile');
      var collection = db.collection("dummyDB");
       db.collection('dummyDB').find({}).toArray( function(err, json){
    if(err){
        console.log(err);
   
    }
    else{
        console.log(json);
        json.forEach(function(doc) {
                console.log("Doc from Array ");
                newjson = JSON.stringify(doc);
                delete newjson["id"];
                console.log(newjson);
        })
        
    }
});
  }       
});         

//mongoose.connect(database.url); 	// connect to mongoDB database on modulus.io


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

fs.readFile( __dirname + "/" + "lijstje2.json", 'utf8', function (err, data) {
datani = JSON.parse( data );
});


app.get('/push', function (req, res) {
    fs.writeFile( __dirname + "/" + "lijstje2.json",newjson , 'utf8', function (err, data) {

});
    
   MongoClient.connect(database.url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    //HURRAY!! We are connected. :)
    console.log('Connection established to');
      var collection = db.collection("dummyDB");
        collection.remove({}, function (err, remove) {});
      collection.insert(datani, function(err, doc) {if(err) throw err;});
  }       
});                   
});

// API 
fs.readFile( __dirname + "/" + "lijstje.json", 'utf8', function (err, data) {
datani = JSON.parse( data );
});

app.get('/randomcode', function (req, res) {
        //Socket
    var RandomRoomCode = randomstring.generate(7);
    
    var nsp = io.of('/'+RandomRoomCode);
        nsp.on('connection', function(socket){
        console.log('someone connected to room: ' + RandomRoomCode);
        socket.on('vraag', function(msg){
        nsp.emit('vraag', msg);
        console.log('vraag: ' + msg);
    });
    socket.on('typevraag', function(type){
        nsp.emit('typevraag', type);
        console.log('typevraag: ' + type);
    });
    socket.on('antwoord', function(antwoord){
        nsp.emit('antwoord', antwoord);
        console.log('antwoord: ' + antwoord);
    });
    socket.on('disconnect', function(){
        console.log('someone disconnected from room: ' + RandomRoomCode);
    });
});
    res.json(RandomRoomCode);
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


app.post('/adduser/:naam', function (req, res) {

        indatabase = false;
        for (var i = 0; i < datani.users.length; i++) {
                

                if (datani.users[i].naam == req.params.naam) {
                    
                    console.log("User is al in database");
                    res.json("User is al in database");
                    console.log(datani.users[i].Lessen);
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
                    []
            }
            datani.users.push(newuser);
            console.log(datani.users);
            res.json(datani.users);
        }
        
        
});
app.post('/addquestion/:naam/:lesnaam/:vraag', function (req, res) {

        indatabase = false;
        indatabaselesnaam = false;
        for (var i = 0; i < datani.users.length; i++) {
                

                if (datani.users[i].naam == req.params.naam) {
                    indatabase = true;
                    console.log("In de database gestoken");
                    for (var x = 0; x < datani.users[i].Lessen.length; x++) {
                                    if (datani.users[i].Lessen[x].naam == req.params.lesnaam) {
                                        indatabaselesnaam = true;

                                        var newvraag =

                                            {
                                                      "vraag":req.params.vraag,
                                                      "id":"0",
                                                      "probleemvraag":"false"
                                             }

                                        datani.users[i].Lessen[x].vragen.push(newvraag);
                                        res.json(datani.users[i].Lessen[x]);
                                        break;
                                    }
                    }
                    if(!indatabaselesnaam){
                     var newlesenvraag =
                     {
                          "naam":req.params.lesnaam,
                          "vragen" : 
                          [{
                               "vraag":req.params.vraag,
                               "id":"0",
                               "probleemvraag":"false"
                           }]
                      }
                     datani.users[i].Lessen.push(newlesenvraag);
                      res.json(datani.users[i].Lessen[x]);  
                
                    }
                    
                    console.log(datani.users[i].Lessen)
                    break;
                }
        }
        if(!indatabase){
            
                               
            
        }
        
        
});


//auth


////////////////////////////////// USER MAKEN EN LES MAKEN APPART/////////////////////////////////////////

/*
app.delete('/delete/:naam', function (req, res) {
   // First read existing users.
    
	 
 
});

*/

var server = http.listen(port, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)

});