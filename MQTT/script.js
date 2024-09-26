// MQTT Broker details
const clientId = "web-client-" + Math.random().toString(36).substring(7);
const host = "lotion.ddns.net";
const port = 3001;
const useSSL = false;

let isConnected = false;
const clients = [];
const subscriptions = {};

const client = new Paho.MQTT.Client(host, port, clientId);
clients.push(client);
subscriptions[clientId] = [];

const statusUpdateTopic = "distance/control";
const predefinedTopics = ['fan', 'light', 'door', 'distance', 'distanceVal', 'irReceivedVal', 'gestures', 'gesturesVal', 'humidity', 'humidityVal', 'temperature', 'temperatureVal'];
const predefinedOptions = ['fan', 'light', 'door', 'distance'];

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
    console.log("Connected to MQTT broker");
    isConnected = true;
    updateConnectionStatus("Connected");

    predefinedTopics.forEach(topic => {
        client.subscribe(topic);
        subscriptions[clientId].push(topic);
        createMessageBox(clientId, topic);
    });
}

function onConnectionLost(responseObject) {
    console.error("Connection lost:", responseObject.errorMessage);
    isConnected = false;
    updateConnectionStatus("Disconnected");
}

function onMessageArrived(message) {
    console.log("Message received:", message);

    const topic = message.destinationName;
    const payload = message.payloadString;

    if (topic === statusUpdateTopic) return;

    let messageBox = document.getElementById(`messageBox-${clientId}-${topic}`);
    if (!messageBox) {
        messageBox = document.getElementById(`messageBox-${topic}`);
    }

    if (!messageBox) {
        createMessageBox(clientId, topic);
        messageBox = document.getElementById(`messageBox-${clientId}-${topic}`);
    }

    messageBox.value = `${new Date().toLocaleTimeString()} - ${payload}\n${messageBox.value}`;

    // if (['fan', 'light', 'door', 'distance'].includes(topic) && ['on', 'off'].includes(payload)) {
    updateDeviceStatus(topic, payload);
    // }

    if (topic === 'distanceValue') {
        updateDeviceValue('distance', payload);
    }

    if (topic === 'irReceivedValue') {
        updateDeviceValue('irReceived', payload);
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function updateDeviceValue(topic, value) {
    const valueElement = document.getElementById(`${topic}Value`);
    if (valueElement) {
        valueElement.textContent = value;
    }
}

function updateDeviceStatus(topic, status) {
    const statusElement = document.getElementById(`${topic}Status`);
    if (statusElement) {
        statusElement.textContent = `${capitalizeFirstLetter(topic)}: ${capitalizeFirstLetter(status)}`;
    }

    const messageBoxElement = document.getElementById(`${topic}Value`);
    if (messageBoxElement) {
        messageBoxElement.textContent = `${capitalizeFirstLetter(status)}`;
    }
}
// function updateDeviceStatus(topic, status) {
//     const statusElements = document.querySelectorAll(`[id^="${topic}Status"]`);
//     statusElements.forEach(statusElement => {
//         statusElement.textContent = `${capitalizeFirstLetter(topic)}: ${capitalizeFirstLetter(status)}`;
//     });
// }


function createMessageBox(clientId, topic) {
    if (document.getElementById(`messageBox-${clientId}-${topic}`)) {
        console.log(`Subscriber for ${topic} already exists.`);
        return;
    }
    updateMainControlPanel()


    const statusContainer = document.createElement('div');
    statusContainer.className = 'status-item'; 
    statusContainer.id = `${topic}Container`;

    // Create the span element
    const spanElement = document.createElement('span');
    spanElement.id = `${topic}Value`;
    spanElement.textContent = 'Unknown'; 

    // Create the text content and append the span
    const textNode = document.createTextNode(`${topic} : `);
    statusContainer.appendChild(textNode);
    statusContainer.appendChild(spanElement);
    
    document.getElementById("deviceStatus").append(statusContainer)


    const topicContainer = document.createElement('div');
    topicContainer.className = 'topic-container';

    const topicLabel = document.createElement('h4');
    topicLabel.textContent = `${capitalizeFirstLetter(topic)} Messages (Client: ${clientId})`;
    topicContainer.appendChild(topicLabel);

    const messageBox = document.createElement('textarea');
    messageBox.rows = 5;
    messageBox.id = `messageBox-${clientId}-${topic}`;
    topicContainer.appendChild(messageBox);

    // Add device status
    const statusDiv = document.createElement('div');
    // statusDiv.id = `${topic}Status-${clientId}`;
    statusDiv.id = `${topic}Status`;
    statusDiv.className = 'status-item';
    statusDiv.textContent = `${capitalizeFirstLetter(topic)}: Unknown`;
    topicContainer.appendChild(statusDiv);

    // Add device control
    const controlDiv = document.createElement('div');
    controlDiv.className = 'device-control';

    const select = document.createElement('select');
    select.id = `control-${topic}-${clientId}`;
    ['on', 'off'].forEach(action => {
        const option = document.createElement('option');
        option.value = action;
        option.textContent = capitalizeFirstLetter(action);
        select.appendChild(option);
    });

    const button = document.createElement('button');
    button.textContent = 'Send Command';
    button.onclick = () => publishMessageForTopic(topic, select.value);

    controlDiv.appendChild(select);
    controlDiv.appendChild(button);
    topicContainer.appendChild(controlDiv);

    const unsubscribeBtn = document.createElement("button");
    unsubscribeBtn.innerHTML = "Unsubscribe";
    unsubscribeBtn.id = `unsubscribeBtn-${clientId}-${topic}`;

    unsubscribeBtn.addEventListener("click", () => {
        unsubscribe(clientId, topic);
    });

    topicContainer.appendChild(unsubscribeBtn);

    document.getElementById('subscribedTopics').appendChild(topicContainer);
}

function publishMessageForTopic(topic, message) {
    if (!isConnected) {
        alert("Not connected to the MQTT broker yet.");
        return;
    }

    const payload = new Paho.MQTT.Message(message);
    payload.destinationName = topic;
    client.send(payload);
}


// Modify the existing publishMessage function to use the new publishMessageForTopic function
function publishMessage() {
    const topic = document.getElementById("topic").value;
    const message = document.getElementById("message").value;

    if (!topic || !message) {
        alert("Please select both device and action.");
        return;
    }

    publishMessageForTopic(topic, message);
}

document.addEventListener("DOMContentLoaded", function () {
    const subscribeButton = document.getElementById("subscribe-button");
    subscribeButton.addEventListener("click", () => {
        const topic = prompt("Enter the topic to subscribe to:").toLowerCase();
        if (topic) {
            // Check if the subscriber already exists
            if (subscriptions[clientId].includes(topic)) {
                alert(`Already subscribed to ${topic}`);
                return;
            }

            client.subscribe(topic, {
                onSuccess: () => {
                    console.log(`Subscribed to topic: ${topic}`);
                    subscriptions[clientId].push(topic);
                    createMessageBox(clientId, topic);
                    alert(`Successfully subscribed to ${topic}`);

                    
                    // If it's a controllable device, update the main control panel
                    if (!predefinedOptions.includes(topic)) {
                        updateMainControlPanel();
                    }
                },
                onFailure: (error) => {
                    console.error(`Failed to subscribe to ${topic}:`, error);
                    alert(`Failed to subscribe to ${topic}. Please check the topic and try again.`);
                }
            });
        }
    });
});

const topicSelect = document.getElementById('topic');
const messageSelect = document.getElementById('message');

topicSelect.addEventListener('change', () => {
    updateMessageOptions();
});

function updateMessageOptions() {
    const selectedTopic = topicSelect.value;

    // Clear existing options
    messageSelect.innerHTML = '';

    if (selectedTopic === 'door') {
        messageSelect.innerHTML = `
            <option value="open">Open</option>
            <option value="close">Close</option>
        `;
    } else {
        // Default options for other devices
        messageSelect.innerHTML = `
            <option value="on">Turn On</option>
            <option value="off">Turn Off</option>
        `;
    }
}


function updateMainControlPanel() {
    const topicSelect = document.getElementById("topic");
    topicSelect.innerHTML = ''; // Clear existing options
    console.log("CHECKK > ",subscriptions)
    subscriptions[clientId].forEach(topic => {
        const option = document.createElement('option');
        option.value = topic;
        option.textContent = capitalizeFirstLetter(topic);
        topicSelect.appendChild(option);
    });
}

function unsubscribe(clientId, topic) {
    let client = clients.find(c => c.clientId === clientId);
    client.unsubscribe(topic);
    subscriptions[clientId] = subscriptions[clientId].filter(t => t !== topic);
    document.getElementById(`messageBox-${clientId}-${topic}`).closest('.topic-container').remove();
}

function updateConnectionStatus(status) {
    const statusElement = document.createElement('div');
    statusElement.id = 'connectionStatus';
    statusElement.textContent = `Connection Status: ${status}`;
    statusElement.style.position = 'fixed';
    statusElement.style.top = '10px';
    statusElement.style.right = '10px';
    statusElement.style.padding = '5px 10px';
    statusElement.style.backgroundColor = status === 'Connected' ? '#4CAF50' : '#f44336';
    statusElement.style.color = 'white';
    statusElement.style.borderRadius = '4px';
    
    const existingStatus = document.getElementById('connectionStatus');
    if (existingStatus) {
        existingStatus.remove();
    }
    document.body.appendChild(statusElement);
}

// python3 -m http.server 8000
// python3 server.py


