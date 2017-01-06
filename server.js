////////////////////////////////////////////// Requires and variables 
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
var express = require('express');
var passport = require('passport');
var FacebookAuth = require('passport-facebook').Strategy;


passport.use(new FacebookAuth({
    clientID: '160901634379580',
    clientSecret: '2a42f07d85f26fcad2a937c115828bc7',
    callbackURL: 'http://ec2-52-40-248-53.us-west-2.compute.amazonaws.com:8080/login/facebook/return',
    profileFields: ['id', 'name', 'displayName', 'photos', 'hometown', 'profileUrl']
  },              
function(accessToken, refreshToken, profile, cb) {
    return cb(null, profile);
  }));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});
              

app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));



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

var port  	 = process.env.PORT || 8080;
var datani;
var indatabase;
var indatabaselesnaam;
var newjson;
var MongoClient = mongodb.MongoClient;
var array = [];
var UserID;
var UserDisplayName;
var UserProfileImage;
var antwoordenArray = [];
var SentPhoto;


//////////////////////////////pulls data out file

fs.readFile( __dirname + "/" + "lijstje2.json", 'utf8', function (err, data) {datani = JSON.parse( data );});

app.get('/heeljson', function (req, res) {	
			res.json(datani);
            console.log(datani);
});

app.get('/push', function (req, res) {
    MongoClient.connect(database.url, function (err, db) {
    if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
      } else {
          console.log('OK pushing to database ');
          res.json("pushed to database");
          var collection = db.collection("dummyDB");
          collection.remove({}, function (err, remove) {});
          collection.insert(datani, function(err, doc) {if(err) throw err;});
  }       
});                   
});

app.get('/pull', function (req, res) {		 
			MongoClient.connect(database.url, function (err, db) {if (err) {console.log('Unable to connect to the mongoDB server. Error:', err);} 
                else {
                    console.log('Connected ready for pull');
                    var collection = db.collection("dummyDB");
                    db.collection('dummyDB').find({}).toArray( function(err, json){
                        if(err){console.log(err);}
                        else{
                            console.log('pulling json writing to file');
                            res.json("pulled from database");
                            json.forEach(function(doc) {
                            datani = JSON.stringify(doc);
                            console.log(datani);
                            fs.writeFile( __dirname + "/" + "lijstje2.json",datani , 'utf8', function (err, data) {});
                            fs.readFile( __dirname + "/" + "lijstje2.json", 'utf8', function (err, data) {datani = JSON.parse( data );});
                            })
                        }
                    });
                    }       
            });      
});

var currentvragen = [
        {"vraag":"hallo ?", "type":"open", "id":"12345"},  
        {"vraag":"hallo oke ?", "type":"OpenVraag", "id":"54321"}
];
var idray = [
        {"socketids":"15616"},  
        {"socketids":"15648"}
];

app.get('/randomcode', function (req, res) {
    var RandomRoomCode = randomstring.generate(7);
    var nsp = io.of('/'+RandomRoomCode);
        nsp.on('connection',  function(socket){
        var socketid = socket.id;
        console.log('someone connected to room: ' + RandomRoomCode + ' '+ socketid);
        for (var i = 0; i < currentvragen.length; i++) {
            if(currentvragen[i].id == RandomRoomCode){
                nsp.to(socketid).emit('vraag', currentvragen[i].vraag);
                nsp.to(socketid).emit('typevraag', currentvragen[i].type);
                nsp.to(socketid).emit('Antwoorden', antwoordenArray);
                
            }  
        }
        
    socket.on('vraag', function(msg){
        antwoordenArray = [];
        for (var i = 0; i < currentvragen.length; i++) {
            if(currentvragen[i].id == RandomRoomCode){
               
                currentvragen[i].vraag = msg;
            }
            else{
                var element = {};
                element.vraag = msg;
                element.type = "casdcasn";
                element.id = RandomRoomCode;
                currentvragen.push(element)
            }
        }
        nsp.emit('vraag', msg);
        console.log('vraag: ' + msg);
    });
            
    socket.on('Antwoorden', function(Antwoorden){
        antwoordenArray = Antwoorden;
        nsp.emit('Antwoorden', antwoordenArray);
        console.log('Antwoorden: ' + antwoordenArray);
    });
    
    socket.on('typevraag', function(type){
        for (var i = 0; i < currentvragen.length; i++) {
            if(currentvragen[i].id == RandomRoomCode){
                currentvragen[i].type = type;
            }
        }
        nsp.emit('typevraag', type);
        console.log('typevraag: ' + type);
    });
               
            
    socket.on('antwoord', function(antwoord){
            nsp.emit('antwoord', antwoord);
            console.log('antwoord: ' + antwoord);  
            var element = {};
            element.socketids = socket.id;
    });
            
    socket.on('user image', function(image){
        image;
        nsp.emit('addimage', 'Image received: ', image);
    });  
            
    socket.on('disconnect', function(){
        console.log('someone disconnected from room: ' + RandomRoomCode);
    });
            
    socket.on('close', function(){
        socket.disconnect();
        console.log('socket closed: ' + RandomRoomCode);
    });
            
});
    res.json(RandomRoomCode);
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
                                console.log(datani.users[i].Lessen[x].vragen); 
                                res.json(datani.users[i].Lessen[x].vragen);
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

app.get('/probleemvragen/:naam/:lesnaam', function (req, res) {
    
   
    array = [];
    for (var i = 0; i < datani.users.length; i++) {
                if (datani.users[i].naam == req.params.naam) {
                    console.log(req.params.naam+" is in de database");   // naam is in database
                        for (var x = 0; x < datani.users[i].Lessen.length; x++) {
                            if (datani.users[i].Lessen[x].naam == req.params.lesnaam) {
                                indatabaselesnaam = true;
                                console.log(req.params.lesnaam+" is in de database");
                                for (var y = 0; y < datani.users[i].Lessen[x].vragen.length; y++) {
                                    if(datani.users[i].Lessen[x].vragen[y].probleemvraag === "true"){
                                        array.push(datani.users[i].Lessen[x].vragen[y].vraag);
                                        
                                    }
                                }
                                console.log(array);
                                res.json(array);
                                break;
                            }
                        }
                    
                    break;
                }
        }
    
    
});


app.post('/adduser/:naam', function (req, res) {
    
             console.log(datani)
        indatabase = false;
        for (var i = 0; i < datani.users.length; i++) {
                if (datani.users[i].naam == req.prams.naam) {
                    
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
                                        
                                        
                                        
                                        for (var s = 0; s < datani.users[i].Lessen.length; s++) {
                                            if (datani.users[i].Lessen[x].vragen[s].vraag == req.params.vraag) {
                                                    
                                                    console.log("vraag al in database")
                                                }else{
                                                    datani.users[i].Lessen[x].vragen.push(newvraag);
                                                }
                                            
                                        }
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
                                           "vraag":req.params.vraag,
                                           "id":"0",
                                           "probleemvraag":"false"
                                       }]
                                  }]
                            }
                            datani.users.push(newuser);
                            console.log(datani.users);
                            res.json(datani.users);
                               
            
        }
        
        
});

app.post('/probleemvraag/:naam/:lesnaam/:vraag/:bool', function (req, res) {
        for (var i = 0; i < datani.users.length; i++) {
                if (datani.users[i].naam == req.params.naam) {
                    for (var x = 0; x < datani.users[i].Lessen.length; x++) {
                                    if (datani.users[i].Lessen[x].naam == req.params.lesnaam) {
                                         for (var y = 0; y < datani.users[i].Lessen[x].vragen.length; y++) {    
                                             if (datani.users[i].Lessen[x].vragen[y].vraag == req.params.vraag) {
                                                if(req.params.bool == 'true'){
                                                    datani.users[i].Lessen[x].vragen[y].probleemvraag = "true"
                                                }
                                                if(req.params.bool == 'false'){
                                                    datani.users[i].Lessen[x].vragen[y].probleemvraag = "false"
                                                }
                                                 res.json("de boolean is: " +datani.users[i].Lessen[x].vragen[y].probleemvraag)
                                             }
                                             
                                         }
                                        break;
                                    }
                    }
                    
                }
        }
        if(!indatabase){  
        }  
});
////////////////////////////////// USER MAKEN EN LES MAKEN APPART/////////////////////////////////////////


//auth

//facebook
app.get('/login/facebook',
  passport.authenticate('facebook'));

app.get('/login/facebook/return', 
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/teacherOverzicht.html');
    UserID = req.user.id;
    UserDisplayName = req.user.displayName;
    
    UserProfileImage = req.user._json.picture.data.url;
    console.log(req.user._json.picture.data.url)
  });

app.get('/profileInfo', function(req, res){
    var User = UserID + UserDisplayName;
    var ProfilePicture = UserProfileImage
    res.json({name: User , url: ProfilePicture});
    
});


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