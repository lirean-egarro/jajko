var bodyParser = require('body-parser');
var finalhandler = require('finalhandler');
var http = require('http');
var router = require('router')();

var done;
var UM = require('./modules/user-manager'); 

//This middleware will populate the req.body with the incoming parameters
router.use(bodyParser.json())

router.post('/login', function(req, res) {
	//Security checks are done in the UM package:
    if(req.body != undefined) {
		UM.login(req.body.user,req.body.password,function(err,t){
			if(!t) {
				done(err.message)
			} else {
				if(!err) {
					res.statusCode = 200
					res.setHeader('Content-Type','text/plain')
					res.end(t)
				} else {
					res.statusCode = 210 //User exists, but hasnt completed the required questionnaire.
					res.setHeader('Content-Type','text/plain')
					res.end(t)
				}
			}
		});
    } else {
            done("Request does not have a body")
    }
});

router.post('/questionnaire', function(req, res) {
	if(req.cookies != undefined && (req.cookies.user == undefined || req.cookies.token == undefined)) {
		done("Username or password missing. POST request most be authenticated")
	} else {
		//Check for valid token
		UM.processToken(req.cookies.user, req.cookies.token, function(err,u){
			if(!u) {
				done(err.message)
			} else if(req.answers != undefined) {
				UM.update(u,req.answers, function(err) {
					if(err) {
						done(err.message)
					} else {
						res.statusCode = 200
						res.setHeader('Content-Type','text/plain')			
						res.end('ok')
					}
				});				
			} else {
				done("Malformed POST request: answers not found")
			}
		});
	}
});

router.post('/user', function(req, res) {
	if(req.body != undefined) {
		UM.create(req.body.email,req.body.password,function(err){
			if(err) {
				done(err.message)
			} else {
				UM.login(req.body.email,req.body.password,function(err,t){
					if(err) {
						done(err.message)
					} else {
						res.statusCode = 200
						res.setHeader('Content-Type','text/plain')
						res.end(t)
					}
				});
			}
		});
	} else {
		done("Request does not have a body")
	}
});

var server = http.createServer(function(req,res){
	done = finalhandler(req,res)
        router(req, res, done)
});

console.log('Server running on port 8082');
server.listen(8082); // start the server on port 8082

