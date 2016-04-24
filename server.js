var async = require('async');
var express = require('express');
watson = require('watson-developer-cloud');
var app = express();

var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies

var concept_insights = watson.concept_insights({
  username: '5433dda8-a455-4c68-a3c1-90c59a385e9a',
  password: 'gPsiXkdkMUtz',
  version: 'v2'
});

var re_credentials =  {
  	url: 'https://gateway.watsonplatform.net/relationship-extraction-beta/api',
  	username: '38785a5c-8f23-48b7-bbe9-cc158f31f6ad',
  	password: 'pacXcl8KOdY3',
  	version: 'v1-beta'
}

app.post('/api/format_command', function(req, res) {
	var text = req.body.text;
	format_command(text)
	.then(result => {
		res.json(result)
	})
	.catch(error => {
		res.json(error)
	});
});

app.post('/api/match_commands', function(req, res) {
	var text = req.body.text;
	var commands = req.body.commands;
	match_commands(text, commands)
	.then(result => {
		//res.json(result.filter(command => command.distance < 0.1))
		var relevant = result.filter(command => command.distance < 0.1)
		/*
		async.filter(result, function(command, cb){
			cb(true)//command.distance > 0.85);
		}, function(err, filtered){
			res.json(filtered)
		});
		*/
		if(relevant.length > 0) {
			res.json(relevant[0])
		} else {
			res.json(null)
		}
		//res.json(result)
	})
	.catch(err => {
		res.json(error);
	});
});

var cfenv = require('cfenv');

// create a new express server

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  console.log("server starting on " + appEnv.url);
});
/*
app.listen(3000, function () {
  	console.log('Example app listening on port 3000!');
});
*/

var format_command = function(sentence) {
	var promise = new Promise(function(resolve, reject){
		var relationshipExtraction = watson.relationship_extraction(re_credentials);
		relationshipExtraction.extract({
    				text: sentence,
    				dataset: 'ie-en-news'
  			}, function(err, results) {
    				if (err) {
					reject(err)
				} else {
					resolve(results.doc.sents.sent[0].usd_dependency_parse)
				}
  			});
	});
	return promise;
}

var match_commands = function(text, commands) {

	var promise = new Promise(function(resolve, reject) {
		format_command(text)
		.then(function(heard_command) {
			var heard_root = get_root(heard_command);
			var heard_negated = root_is_negated(heard_command)
			async.map(commands, function(command, cb) {
				var root = get_root(command.signature)
				var root_negated = root_is_negated(command.signature)
				var distance = 0;
				if(heard_negated != root_negated) {
					command.distance = 1;
					cb(null, command)
				} else if(root != heard_root) {
					get_word_distance(root, heard_root)
					.then(result => {
						distance += result;
						command.distance = distance;
						cb(null, command)
					})
					.catch(err => {
						distance += 1;
						command.distance = distance;
						cb(null, command)
					});
				} else {
					command.distance = distance;
					cb(null, command)
				}
			}, function(err, results){
				if(err){
					reject(err)
				} else {
					resolve(results);
				}
			});
		});
	});
	return promise;
}

var get_root = function(command_signature) {
	//return command_signature.split(' ')[0];
	var split = command_signature.split(' ');
	var root_index = split.indexOf('root') - 3
	return split[root_index]
}

var root_is_negated = function(command_signature) {
	var split = command_signature.split(' ');
	var neg_index = split.indexOf('not')
	if(neg_index) {
		var root = get_root(command_signature)
		var root_index = split.indexOf(root) / 4
		var neg_pointer = split[neg_index + 3]
		return neg_pointer == root_index
	}
	return false;
}

var get_concept = function(word) {
	var promise = new Promise(function(resolve, reject){
		var params = {
  			graph: '/graphs/wikipedia/en-latest',
  			text: word
		}
		concept_insights.graphs.annotateText(params, function(err, res) {
  			if (err)
				reject(err)
  			else {
				var annotations = res.annotations;
				if(annotations.length > 0) {
					resolve(res.annotations[0].concept.id)
				} else {
					reject('no concept');
				}
  			}
		});
	});
	return promise;
}

var compare_concepts = function(concept, concepts) {
	var promise = new Promise(function(resolve, reject) {
		var params = {
			id: concept,
			concepts: concepts
		}
		concept_insights.graphs.getRelationScores(params, function(err, res) {
		  if (err)
			reject(err)
		  else {
			distance = 1 - res.scores[0].score;
			resolve(distance)
		  }
		});
	})
	return promise;
}

var get_word_distance = function(w1, w2) {
	var promise = new Promise(function(resolve, reject){
		get_concept(w1)
		.then(function(c1){
			get_concept(w2)
			.then(function(c2){
				compare_concepts(c1, [c2])
				.then(resolve)
				.catch(reject)
			})
			.catch(reject)
		})
		.catch(reject)
	});
	return promise;
}
