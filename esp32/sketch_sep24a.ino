#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <WiFi.h>
#include <PubSubClient.h>

// BLE Service and Characteristic UUIDs
#define SERVICE_UUID        "00000001-0000-1000-8000-00805F9B34FB"
#define GESTURE_CHAR_UUID   "00000002-0000-1000-8000-00805F9B34FB"
#define ENV_DATA_CHAR_UUID  "00000003-0000-1000-8000-00805F9B34FB"

static BLEUUID serviceUUID(SERVICE_UUID);
static BLEUUID gestureCharUUID(GESTURE_CHAR_UUID);
static BLEUUID envDataCharUUID(ENV_DATA_CHAR_UUID);

static boolean doConnect = false;
static boolean connected = false;
static boolean doScan = false;
static BLERemoteCharacteristic* pGestureCharacteristic;
static BLERemoteCharacteristic* pEnvDataCharacteristic;
static BLEAdvertisedDevice* myDevice;

const char* gestures[] = {"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"};
const int ledPin = 25; 

// Wi-Fi credentials
const char* ssid = "Amitohut";
const char* password = "saythankyou";
// const char* ssid = "Time_Machine";
// const char* password = "54321abcde";
bool isPublishing = false;  // Flag to track publishing status
bool isPublishingTemperature = false;  // Flag to track publishing status
bool isPublishingHumidity = false;  // Flag to track publishing status
bool isPublishingGesture = false;  // Flag to track publishing status
bool ledStatus = false;

// MQTT broker credentials
const char* mqttServer = "lotion.ddns.net";
const int mqttPort = 1883;
const char* clientId = "ESP32Client";

// MQTT topics
const char* ledTopic = "light"; 
const char* ledValueTopic = "lightVal"; 
const char* distanceValueTopic = "distanceVal";
const char* distanceTopic = "distance"; 
const char* gesturesValueTopic = "gesturesVal";
const char* gesturesTopic = "gestures";
const char* humidityValueTopic = "humidityVal";
const char* humidityTopic = "humidity";
const char* temperatureValueTopic = "temperatureVal";
const char* temperatureTopic = "temperature";

WiFiClient espClient;
PubSubClient client(espClient);

// HC-SR04 pins
const int trigPin = 32;
const int echoPin = 33;

unsigned long lastMsg = 0;
#define MSG_BUFFER_SIZE (50)
char msg[MSG_BUFFER_SIZE];
int value = 0;

static void gestureNotifyCallback(
  BLERemoteCharacteristic* pBLERemoteCharacteristic,
  uint8_t* pData,
  size_t length,
  bool isNotify) {
    if (length == sizeof(int)) {
        int gestureIndex = *(int*)pData;
        if (gestureIndex >= 0 && gestureIndex < 15) {
            Serial.print("Received gesture: ");
            Serial.println(gestures[gestureIndex]);
            Serial.println(isPublishingGesture);
            if (isPublishingGesture) {
              // char gestureStr[10]; 
              // dtostrf(gestures[gestureIndex], 6, 2, gestureStr); 
              Serial.print("Message Publishing [");
              Serial.print(gesturesValueTopic);
              Serial.print("] ");
              Serial.print(": ");
              Serial.println(gestures[gestureIndex]); 
              if (!client.publish(gesturesValueTopic, gestures[gestureIndex])) { 
                Serial.println("Failed to publish message");
              }    
            }

        } else {
            Serial.println("Received invalid gesture index");
        }



    } else {
        Serial.print("Received gesture data of unexpected length: ");
        Serial.println(length);
    }
}
static void envDataNotifyCallback(
  BLERemoteCharacteristic* pBLERemoteCharacteristic,
  uint8_t* pData,
  size_t length,
  bool isNotify) {
  
    if (length == 2 * sizeof(float)) {
        // Extract temperature and humidity from the data
        float temperature = *(float*)pData;
        float humidity = *(float*)(pData + sizeof(float));

        // Print the values to the Serial monitor
        Serial.print("Message arrived [Temperature] :");
        Serial.print(temperature);
        Serial.println("°C");

        Serial.print("Message arrived [Humidity] :");
        Serial.print(humidity);
        Serial.println("%");


        if (isPublishingHumidity) {
          char humidityStr[10]; // Make sure this is large enough for the result
          snprintf(humidityStr, sizeof(humidityStr), "%6.2f", humidity);
          Serial.print("Message Publishing [");
          Serial.print(humidityValueTopic);
          Serial.print("] ");
          Serial.print(": ");
          Serial.println(humidityStr); 
          if (!client.publish(humidityValueTopic, humidityStr)) { 
            Serial.println("Failed to publish message");
          }    
        }
        if (isPublishingTemperature) {
          char temperatureStr[10]; // Make sure this is large enough for the result
          snprintf(temperatureStr, sizeof(temperatureStr), "%6.2f", temperature);
          Serial.print("Message Publishing [");
          Serial.print(temperatureValueTopic);
          Serial.print("] ");
          Serial.print(": ");
          Serial.println(temperatureStr); 
          if (!client.publish(temperatureValueTopic, temperatureStr)) { 
            Serial.println("Failed to publish message");
          }    
        }
        
    } else {
        Serial.print("Received environmental data of unexpected length: ");
        Serial.println(length);
    }
}


class MyClientCallback : public BLEClientCallbacks {
  void onConnect(BLEClient* pclient) {
    connected = true;
    Serial.println("Connected to BLE Server");
  }

  void onDisconnect(BLEClient* pclient) {
    connected = false;
    Serial.println("Disconnected from BLE Server");
  }
};

bool connectToServer() {
    Serial.print("Forming a connection to ");
    Serial.println(myDevice->getAddress().toString().c_str());
    
    BLEClient*  pClient  = BLEDevice::createClient();
    Serial.println(" - Created client");

    pClient->setClientCallbacks(new MyClientCallback());

    // Connect to the remote BLE Server.
    pClient->connect(myDevice);
    Serial.println(" - Connected to server");

    // Obtain a reference to the service we are after in the remote BLE server.
    BLERemoteService* pRemoteService = pClient->getService(serviceUUID);
    if (pRemoteService == nullptr) {
      Serial.print("Failed to find our service UUID: ");
      Serial.println(serviceUUID.toString().c_str());
      pClient->disconnect();
      return false;
    }
    Serial.println(" - Found our service");

    // Obtain a reference to the gesture characteristic
    pGestureCharacteristic = pRemoteService->getCharacteristic(gestureCharUUID);
    if (pGestureCharacteristic == nullptr) {
      Serial.print("Failed to find gesture characteristic UUID: ");
      Serial.println(gestureCharUUID.toString().c_str());
      pClient->disconnect();
      return false;
    }
    Serial.println(" - Found gesture characteristic");

    if(pGestureCharacteristic->canNotify()) {
      pGestureCharacteristic->registerForNotify(gestureNotifyCallback);
      Serial.println("Registered for gesture notifications");
    }

    // Obtain a reference to the environmental data characteristic
    pEnvDataCharacteristic = pRemoteService->getCharacteristic(envDataCharUUID);
    if (pEnvDataCharacteristic == nullptr) {
      Serial.print("Failed to find environmental data characteristic UUID: ");
      Serial.println(envDataCharUUID.toString().c_str());
      pClient->disconnect();
      return false;
    }
    Serial.println(" - Found environmental data characteristic");

    if(pEnvDataCharacteristic->canNotify()) {
      pEnvDataCharacteristic->registerForNotify(envDataNotifyCallback);
      Serial.println("Registered for environmental data notifications");
    }

    connected = true;
    return true;
}

class MyAdvertisedDeviceCallbacks: public BLEAdvertisedDeviceCallbacks {
  void onResult(BLEAdvertisedDevice advertisedDevice) {
    Serial.print("BLE Advertised Device found: ");
    Serial.println(advertisedDevice.toString().c_str());

    if (advertisedDevice.haveServiceUUID() && advertisedDevice.isAdvertisingService(serviceUUID)) {
      BLEDevice::getScan()->stop();
      myDevice = new BLEAdvertisedDevice(advertisedDevice);
      doConnect = true;
      doScan = true;
    }
  }
};

void setupWifi() {
  Serial.print("Connecting to Wi-Fi: ");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }

  Serial.println("Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  WiFi.enableIPv6();
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  
  char message[length + 1];
  for (int i = 0; i < length; i++) {
    message[i] = (char)payload[i];
  }
  message[length] = '\0'; 

  Serial.println(message);
  Serial.println();

  // Handle distance publishing
  if (strcmp(topic, distanceTopic) == 0) {
    if (strcmp(message, "on") == 0) {
      isPublishing = true;
      Serial.println("Starting distance publishing");
    } else if (strcmp(message, "off") == 0) {
      isPublishing = false;
      Serial.println("Stopping distance publishing");
    }
  }

  // Handle temperature publishing
  if (strcmp(topic, temperatureTopic) == 0) {
    if (strcmp(message, "on") == 0) {
      isPublishingTemperature = true;
      Serial.println("Starting temperature publishing");
    } else if (strcmp(message, "off") == 0) {
      isPublishingTemperature = false;
      Serial.println("Stopping temperature publishing");
    }
  }

  // Handle humidity publishing
  if (strcmp(topic, humidityTopic) == 0) {
    if (strcmp(message, "on") == 0) {
      isPublishingHumidity = true;
      Serial.println("Starting humidity publishing");
    } else if (strcmp(message, "off") == 0) {
      isPublishingHumidity = false;
      Serial.println("Stopping humidity publishing");
    }
  }

  // Handle gesture publishing
  if (strcmp(topic, gesturesTopic) == 0) {
    if (strcmp(message, "on") == 0) {
      isPublishingGesture = true;
      Serial.println("Starting gesture publishing");
    } else if (strcmp(message, "off") == 0) {
      isPublishingGesture = false;
      Serial.println("Stopping gesture publishing");
    }
  }

  if (strcmp(topic, "statusGet") == 0) {
    if (strcmp(message, "get") == 0) {
      // Create a JSON string to hold the status information
      String statusJson = "{\"isPublishing\":";
      statusJson += isPublishing ? "true" : "false";
      statusJson += ",\"isPublishingTemperature\":";
      statusJson += isPublishingTemperature ? "true" : "false";
      statusJson += ",\"isPublishingHumidity\":";
      statusJson += isPublishingHumidity ? "true" : "false";
      statusJson += ",\"isPublishingGesture\":";
      statusJson += isPublishingGesture ? "true" : "false";
      statusJson += ",\"ledStatus\":";
      statusJson += ledStatus ? "true" : "false";
      statusJson += "}";

      // Publish the status JSON
      if (!client.publish("status", statusJson.c_str())) {
        Serial.println("Failed to publish status message");
      }
    }
  }

  if (strcmp(topic, "light") == 0) {
    if (strcmp(message, "on") == 0) {
      digitalWrite(ledPin, HIGH); // Turn on the LED
      ledStatus = true;
      if(!client.publish(ledValueTopic, "on")){
        Serial.println("Failed to publish led message");
      }else{
        Serial.print("Message Publishing [");
        Serial.print(ledValueTopic);
        Serial.print("] ");
        Serial.print(": on");
      }
    } else if (strcmp(message, "off") == 0) {
      digitalWrite(ledPin, LOW);  // Turn off the LED
      ledStatus = false;
      if(!client.publish(ledValueTopic, "off")){
        Serial.println("Failed to publish led message");
      }else{
        Serial.print("Message Publishing [");
        Serial.print(ledValueTopic);
        Serial.print("] ");
        Serial.print(": off");
      }
    }
  }

}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");

    if (client.connect(clientId)) {
      Serial.println("Connected");
      client.subscribe(ledTopic);
      client.subscribe(distanceTopic);
      client.subscribe(humidityTopic);
      client.subscribe(temperatureTopic);
      client.subscribe(gesturesTopic);
      client.subscribe("statusGet");
    } else {
      Serial.print("Failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(10000);  
    }
  }
}

long readDistance() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH);
  if (duration > 0) {  
    return (duration / 2) * 0.0343; // Convert to centimeters
  } else {
    snprintf(msg, MSG_BUFFER_SIZE, "No component"); 
    return -1; 
  }
}

void startDistanceModule(){
  long now = millis();
  if (now - lastMsg > 1000) { 
    lastMsg = now;

    int distance = readDistance();
    if(distance != -1){
      snprintf(msg, MSG_BUFFER_SIZE, "%ld", distance);
    }
    Serial.print("Message Publishing [");
    Serial.print(distanceValueTopic);
    Serial.print("] ");
    Serial.print(": ");
    Serial.println(msg); 
    if (!client.publish(distanceValueTopic, msg)) { 
      Serial.println("Failed to publish message");
    }    
  }
}

void setup() {
  pinMode(ledPin, OUTPUT); 

  Serial.begin(115200);
  
  // Initialize BLE
  Serial.println("Starting Arduino BLE Client application...");
  BLEDevice::init("");
  
  BLEScan* pBLEScan = BLEDevice::getScan();
  pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
  pBLEScan->setInterval(1349);
  pBLEScan->setWindow(449);
  pBLEScan->setActiveScan(true);
  pBLEScan->start(5, false);

  // Initialize WiFi and MQTT
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

  setupWifi();
  client.setServer(mqttServer, mqttPort);
  client.setCallback(callback);
}

void loop() {
  // BLE Connection logic
  if (doConnect == true) {
    if (connectToServer()) {
      Serial.println("We are now connected to the BLE Server.");
    } else {
      Serial.println("We have failed to connect to the server; there is nothing more we will do.");
    }
    doConnect = false;
  }

  if (!connected && doScan) {
    BLEDevice::getScan()->start(0);
  }

  // MQTT and Distance sensor logic
  if (!client.connected()) {
    reconnect();
  }
  
  client.loop();

  if (isPublishing) {  
    startDistanceModule();
  }

  delay(1000);
}
