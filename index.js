var bodyParser = require('body-parser');
var finalhandler = require('finalhandler');
var http = require('http');
var router = require('router')();
var util = require('util');

var UM = require('./modules/user-manager'); 

//This middleware will populate the req.body with the incoming parameters
router.use(bodyParser.urlencoded({extended:false}));

router.post('/login', function(req, res) {
	//Security checks are done in the UM package:
	UM.login(req.body.user,req.body.password,function(err,t){
		if(!u) {
			res.send(err,400);
		} else {
			res.send({'sessionToken':t},200);
		}
	});
});

router.post('/questionnaire', function(req, res) {
	if(req.cookies != "undefined" && (req.cookies.user == "undefined" || req.cookies.token == "undefined")) {
		res.send({message:"Username or password missing. POST request most be authenticated"},400);
	} else {
		//Check for valid token
		UM.processToken(req.cookies.user, req.cookies.token, function(err,u){
			if(!u) {
				res.send(err,400);
			} else if(req.answers != "undefined") {
				UM.update(u,req.answers, function(err) {
					if(err) {
						res.send(err,400);
					} else {
						res.send({},200);
					}
				});				
			} else {
				res.send({message:"Malformed POST request: answers not found"},400);
			}
		});
	}
});

router.post('/user', function(req, res) {
	if(req.body != "undefined") {
		UM.create(req.body.email,req.body.password,function(err){
			if(err) {
				done(err)
			} else {
				res.statusCode = 200
				res,setHeader('Content-Type','text/plain')
				res.end('ok');
			}
		});
	} else {
		done({ message:"Request does not have a body" })
	}
});

var server = http.createServer(function(req,res){
		var done = finalhandler(req,res)
        router(req, res, done)
});

console.log('Server running on port 8082');
server.listen(8082); // start the server on port 8082

