var express = require('express');
var app = express();
var fs = require('fs');
var spawn = require('child_process').spawn;
var topparser=require("topparser");
var FCM = require('fcm-node');
var server = app.listen(8080);
var regTokens = [];
var bodyParser = require('body-parser');
app.use(bodyParser.json());
let data_builder = "";
const DEFAUT_TOP_DURATION = 2000;



function getTopData(callback, duration) {
	duration = duration || DEFAUT_TOP_DURATION;

	var top = spawn('top');
	top.stdout.on('data', function(data) {
		data_builder+=data.toString();
	});

	setTimeout(function() {
		top.kill();
		callback(topparser.parse(data_builder,10))
	},duration);
}


function sendServerData(req, res) {
	getTopData((data)=>{
		res.status("200").send(data);
	})
}
function checkCpuUsage() {
	getTopData((data)=>{
		var idl = data.cpu.idle;

		if(idl<99) {
		    sendNotification(idl);
		} 
	}, 2000)

}


function saveRegToken(req, res) {
	console.log("saveRegToken req body", req.body)
	regTokens.push(req.body.token);
	res.send(200);
}

let server_key =JSON.parse(fs.readFileSync(('./config.json'))); ;

function sendNotification(idle){
	var idl = idle;
    var fcm = new FCM(server_key);
    for(i=0; i<regTokens.length; i++) {
    var message = {
        to: 'regTokens[i]', 
        notification: {
            title: 'CPU Usage!', 
            body: 'CPU Usage: ' + idl, 
        }, 
    };
    
    fcm.send(message, function(err, response){
        if (err) {
            console.log("Something has gone wrong!");
        } else {
            console.log("Successfully sent with response: ", response);
        }
    });
}
}
setInterval(()=>checkCpuUsage(),10000);
app.get('/sys', sendServerData);
app.post('/save_token', saveRegToken)
console.log("server listening on 8080");
