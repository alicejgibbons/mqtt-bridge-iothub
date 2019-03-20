'use strict';

var mqtt = require('mqtt');  
var Protocol = require('azure-iot-device-mqtt').Mqtt;
var Client = require('azure-iot-device').Client;
var ConnectionString = require('azure-iot-device').ConnectionString;
var Message = require('azure-iot-device').Message;

// String containing Hostname, Device Id & Device Key in the following formats:
//  "HostName=<iothub_host_name>;DeviceId=<device_id>;SharedAccessKey=<device_key>"
var connectionString = process.env.DEVICE_CONNECTION_STRING;
var mqttServer = process.env.MQTT_SERVER; // i.e. 'mqtt://test.mosquitto.org:1883'
var mqttTopic = process.env.MQTT_TOPIC; // i.e. '/v1/flex/001F4808EA60/interesting_events'
var options = {username: process.env.USERNAME, password: process.env.PASSWORD} // auth for topic

console.log('Connection String:\n' + connectionString);
console.log('Connecting with username:\n' + options.username);

if(connectionString == null || typeof(connectionString) == undefined || connectionString.length < 52)
{
	printResultFor('DEVICE_CONNECTION_STRING')('No valid connection string provided');
}

// If no username then set options to be empty
if(options.username == null || typeof(options.username) == undefined || options.username < 1)
{
  options = {}
}

var deviceId = ConnectionString.parse(connectionString).DeviceId;

// Create IoT Hub client
var client = Client.fromConnectionString(connectionString, Protocol);

// Helper function to print results in the console
function printResultFor(op) {
  return function printResult(err, res) {
    if (err) console.log(op + ' error: ' + err.toString());
    if (res) console.log(op + ' status: ' + res.constructor.name);
  };
}

client.open(function (err) {
  if (err) {
    printResultFor('open')(err);
  } else {
    client.on('message', function (msg) {
      console.log('receive data: ' + msg.getData());
    });
    client.on('error', function (err) {
      printResultFor('client')(err);
      if (sendInterval) clearInterval(sendInterval);
      client.close(printResultFor('client.close'));
    });
  }
});

function sendDataToIoTHub(message)
{
  var final_message = new Message(message);
  console.log('Sending to IoT Hub: \n' + final_message.getData());
  client.sendEvent(final_message, printResultFor('send'));
}

var mqttClient = mqtt.connect(mqttServer, options); 
mqttClient.on('connect', () => {  
  mqttClient.subscribe(mqttTopic);
});
mqttClient.on('message', (topic, message) => {  
  console.log(`Received message from device: '${message}' \nTopic: '${topic}'`);
  sendDataToIoTHub(message);
});
