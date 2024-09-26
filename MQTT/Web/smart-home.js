// MQTT connection setup (same as before)
const clientId = "web-client-" + Math.random().toString(36).substring(7);
const host = "lotion.ddns.net";
const port = 3001;
const useSSL = false;

const client = new Paho.MQTT.Client(host, port, clientId);

client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

client.connect({
    onSuccess: onConnect,
    onFailure: (error) => {
        console.error("Connection failed:", error);
        alert("Failed to connect to MQTT broker. Check your settings and try again.");
    },
    useSSL: useSSL
});

function onConnect() {
    console.log("Connected to MQTT broker !!!");
    client.subscribe("light");
    client.subscribe("fan");
    client.subscribe("door");
    client.subscribe("distance");
    client.subscribe("distanceVal");
    client.subscribe("temperature");
    client.subscribe("temperatureVal");
    client.subscribe("humidity");
    client.subscribe("humidityVal");
    client.subscribe("gestures");
    client.subscribe("gesturesVal");
    client.subscribe("status");
    client.subscribe("lightVal");
    publishMessage("statusGet","get");
}


function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("Connection lost: " + responseObject.errorMessage);
    }
}

function onMessageArrived(message) {
    const topic = message.destinationName;
    const payload = message.payloadString;
    console.log("message",topic, payload)

    switch (topic) {
        case "light":
            updateDeviceStatus("light", payload);
            break;
        case "fan":
            updateDeviceStatus("fan", payload);
            break;
        case "door":
            updateDeviceStatus("door", payload);
            break;
        case "gestures":
            updateDeviceStatus("gestures", payload);
            break;
        case "gesturesVal":
            content = payload
            console.log("heloo",content)
            if(payload == '10'){
                content = "Wrong gesture detected!"
            }else if(payload == '1'){
                publishMessage("light", "on");
            }else if(payload == '0'){
                publishMessage("light", "off");
            }else if(payload == '6'){
                publishMessage("humidity", "on");
            }else if(payload == '7'){
                publishMessage("humidity", "off");
            }else if(payload == '11'){
                updateDeviceStatus("fan", 'on');
            }else if(payload == '12'){
                updateDeviceStatus("fan", 'off');
            }else if(payload == '13'){
                updateDeviceStatus("door", 'open');
            }else if(payload == '14'){
                updateDeviceStatus("door", 'close');
            }
            document.getElementById("gesturesValue").textContent = content;
            break;
        case "distance":
            updateDeviceStatus("ultrasonic", payload);
            break;
        case "distanceVal":
            document.getElementById("distanceValue").textContent = payload + " cm";
            break;
        case "humidity":
            updateDeviceStatus("humidity", payload);
            break;
        case "humidityVal":
            document.getElementById("humidityValue").textContent = payload + " %rh";
            break;
        case "temperature":
            updateDeviceStatus("temperature", payload);
            break;
        case "temperatureVal":
            document.getElementById("temperatureValue").textContent = payload + " °C";
            break;
        case "status":
            const statusData = JSON.parse(payload);
            console.log("statusData",payload)
            updateDeviceStatus("ultrasonic", statusData.isPublishing ? "on" : "off");
            updateDeviceStatus("humidity", statusData.isPublishingHumidity ? "on" : "off");
            updateDeviceStatus("temperature", statusData.isPublishingTemperature ? "on" : "off");
            updateDeviceStatus("gestures", statusData.isPublishingGesture ? "on" : "off");
            updateDeviceStatus("light",statusData.ledStatus ? "on" : "off")
            break;
    }
}

function updateDeviceStatus(device, status) {
    console.log("CHECK Device :", device,"CHECK Status :",status)
    const statusElement = document.getElementById(`${device}Status`);
    const toggleElement = document.getElementById(`${device}Toggle`);
    console.log("Fan toggle :", toggleElement)

    if (statusElement && toggleElement) {
        statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        if(device === 'door'){
            toggleElement.checked = status.toLowerCase() === "open";
        }else{
            toggleElement.checked = status.toLowerCase() === "on";
        }
    }
}

// Add event listeners for toggle switches
document.getElementById("lightToggle").addEventListener("change", function() {
    publishMessage("light", this.checked ? "on" : "off");
});

document.getElementById("fanToggle").addEventListener("change", function() {
    publishMessage("fan", this.checked ? "on" : "off");
});

document.getElementById("doorToggle").addEventListener("change", function() {
    publishMessage("door", this.checked ? "open" : "close");
});

document.getElementById("ultrasonicToggle").addEventListener("change", function() {
    publishMessage("distance", this.checked ? "on" : "off");
});

document.getElementById("humidityToggle").addEventListener("change", function() {
    publishMessage("humidity", this.checked ? "on" : "off");
});

document.getElementById("temperatureToggle").addEventListener("change", function() {
    publishMessage("temperature", this.checked ? "on" : "off");
});

document.getElementById("gesturesToggle").addEventListener("change", function() {
    publishMessage("gestures", this.checked ? "on" : "off");
});

function publishMessage(topic, message) {
    console.log("TOPIC",topic)
    const payload = new Paho.MQTT.Message(message);
    payload.destinationName = topic;
    client.send(payload);
}