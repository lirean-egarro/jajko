var crypto = require('crypto');

var MongoClient = require('mongodb').MongoClient;
var userCollection;

var SC = require('./system-config');
var util = require('util');

function createDBConnection(onCreate) {
	MongoClient.connect('mongodb://127.0.0.1:27017/jajko',function(err,db){
		if(err) throw err;
	
		console.log("Successfully connected to JAJKO DB!");
		userCollection = db.collection('users');

		onCreate();
	});
}

/* Exported functions. */

exports.login = function(email,password,callback) {
	if(email != undefined && password != undefined) {
		saltAndHash(password, function(hash) {
			userCollection.findOne({'email':email,'password':password},function(err,doc){
				if(doc) {
					//Here we will generate a token for this session and store in the document!
					var token = generateToken();
					doc.token = token;
					userCollection.save(doc, {safe:true}, function(err) {
						if(!err) {	
							callback(null,token);
						} else {
							callback({ message:"Error processing login. Cannot store session token? " + err },null);
						}
					});
				} else {
					callback({ message:"Wrong credentials. Please try again." },null);	
				}
			});
		});
	} else {
		callback({ message:"Email and password are mandatory to login." });		
	}
}

exports.processToken = function(email,token,callback) {
	userCollection.findOne({'email':email,'token':token},function(err,doc){
		if(doc) {
			callback(null,doc);
		} else {
			callback({ message:"The token for user is invalid!" },null);
		}	
	});
}

exports.create = function(email,password,callback) {
	if(email != undefined && password != undefined) {
		userCollection.findOne({'email':email},function(err,doc){
			if(doc) {
				callback({ message:"There seems to be a user with this email address." });
			} else {
				if(email === null || password === null || email.length < 5 || password.length < 5) {
					callback({ message:"Wrong email or password. Both parameters must have at least length 5" });	
				} else {
				//Create the user:
					saltAndHash(password, function(hash) {
						userCollection.insert({ 'email':email, 'password':hash }, { safe:true }, function(err) {
							if(!err) {
								console.log("New user added to DB")
								callback(null);
							} else {
								callback(err);
							}
						});
					});
				}
			}
		});
	} else {
		callback({ message:"Email and password are mandatory to create a user." });		
	}
}

exports.update = function(user,answers,callback) {
	if(user.email != null && user.token != null && user.password != null) {
		user.answers = answers;
		userCollection.save(user, { safe: true }, function(err) {
			if(!err) {
				callback(null);
			} else {
				callback({ message:"Error updating record login: " + err });
			}
		});
	} else {
		callback({ message:"Invalid user object provided while updating record" });
	}
}

/* Private encryption & validation methods */

var generateToken = function() {
	var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
	var token = '';
	for (var i = 0; i < 15; i++) {
		var p = Math.floor(Math.random() * set.length);
		token += set[p];
	}
	return token;
}

var md5 = function(str) {
	return crypto.createHash('md5').update(str).digest('hex');
}

var saltAndHash = function(pass, callback) {
	var salt = SC.salt;
	callback(md5(salt+pass));
}

/* STARTING POINT FOR THIS MODULE */
createDBConnection(function(){});
