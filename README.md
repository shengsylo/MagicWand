<!DOCTYPE html>
<html>


<body>
<p>
<b>*** Only works on <a href="https://docs.arduino.cc/hardware/nano-33-ble-sense/" target="_blank">Arduino Nano 33 Ble Sense </a> <code>(Rev1)</code>  ***</b>
</p>
<p>
<b>*** The code is not supported on <a href="https://docs.arduino.cc/hardware/nano-33-ble-sense-rev2/" target="_blank">Arduino Nano 33 Ble Sense </a> <code>(Rev2)</code>  ***</b>
</p>

<h1 align="center">The Smart Home Magician</h1>

<p align="center">
  <b>Gesture-Based Home Automation System</b>
</p>

<p align="center">
  <img src="Image/Results.png" alt="Result" width="400"> 
  <img src="Image/SmartHomeControl.png" alt="SmartHomeControl" width="400"> 
  <img src="Image/MQTTDeveloperPage.png" alt="MQTTDeveloperPage.png" width="400"> 
</p>

<h2 id="project-overview">Project Overview</h2>

<p>
The Smart Home Magician is an innovative home automation system that leverages gesture recognition technology to provide a more intuitive and hands-free user experience. It aims to address the limitations of traditional home automation systems by offering a gesture-controlled interface, eliminating the need for physical controls or complex voice commands.
</p>

<h2 id="features">Features</h2>

<ul>
<li><b>Gesture Recognition:</b> Accurately recognizes and classifies hand gestures using machine learning algorithms and sensor data.</li>
<li><b>Smart Home Control:</b> Seamlessly integrates with various smart home devices, enabling control of lighting, temperature, appliances, and more.</li>
<li><b>Wireless Communication:</b> Utilizes Bluetooth and Wi-Fi for efficient data transfer and remote control capabilities.</li>
<li><b>Environmental Monitoring:</b> Monitors humidity and temperature levels for potential automation based on environmental conditions.</li>
<li><b>User-Friendly Interface:</b> Provides an intuitive and accessible interface for users of all ages and abilities.</li>
</ul>

<h2 id="hardware-components">Hardware Components</h2>

<ul>
<li><b>Arduino Nano 33 BLE Sense:</b> The central processing unit responsible for gesture recognition, sensor data collection, and decision-making.
<p align="center">
  <img src="Image/Nano33blePinDefination.png" alt="Arduino Nano 33 BLE Sense Pin Definitions" width="400">
  <img src="Image/Nano33blePinDetails.png" alt="Arduino Nano 33 BLE Sense Pin Details" width="400">
  <img src="Image/Nano33bleBoardTopology.png" alt="Arduino Nano 33 BLE Sense Board topology top" width="400"> 
</p>
</li>
<li><b>ESP32-WROOM-32UE:</b> Provides Wi-Fi connectivity and facilitates communication with external devices and cloud services.
<p align="center">
  <img src="Image/ESP32-Wroom-32UEPinLayout.png" alt="ESP32-WROOM-32UE Pin Layout" width="400">
  <img src="Image/ESP32-Wroom-32UEPinDef.png" alt="ESP32-WROOM-32UE Pin Definitions 1" width="400">
  <img src="Image/ESP32-Wroom-32UEPinDef.png" alt="ESP32-WROOM-32UE Pin Definitions 2" width="400">
</p>
</li>
<li><b>Other Components:</b> Includes touch sensors, IR receivers and transmitters, relays, buzzers, vibration modules, and LEDs for various input and output functionalities.</li>
</ul>

<h2 id="software-libraries">Software Libraries</h2>

<ul>
<li><b>Arduino Nano 33 BLE Sense:</b>
    <ul>
    <li><code>ArduinoBLE</code></li>
    <li><code>Arduino_LSM9DS1</code></li>
    <li><code>TensorFlowLite</code></li>
    <li><code>Arduino_HTS221</code></li>
    <li><code>cmath</code></li>
    <li><code>Arduino_APDS9960</code></li>
    </ul>
</li>
<li><b>ESP32-WROOM-32UE:</b>
    <ul>
    <li><code>BLEDevice</code></li>
    <li><code>BLEUtils</code></li>
    <li><code>BLEServer</code></li>
    <li><code>WiFi.h</code></li>
    <li><code>PubSubClient</code></li>
    </ul>
</li>
</ul>

<h2 id="system-architecture">System Architecture</h2>

<p>
The system architecture is composed of two primary modules:
</p>

<ul>
<li><b>Arduino Nano 33 BLE Sense:</b> Collects sensor data, processes it using TensorFlow Lite for gesture recognition, and controls actuators based on the recognized gestures.</li>
<li><b>ESP32-WROOM-32UE:</b> Establishes Wi-Fi connectivity, handles MQTT communication for data exchange with the Arduino and cloud services, and enables remote control functionality.</li>
</ul>

<!-- <p align="center">
  <img src="path/to/Image 7.jpg" alt="System Architecture Diagram" width="600">
</p>

<p align="center">
  <img src="path/to/Image 8.jpg" alt="System Flowchart" width="600">
</p> -->

<h2 id="installation-and-setup">Installation and Setup</h2>

<ol>
<li><b>Hardware Assembly:</b> Connect the Arduino Nano 33 BLE Sense, ESP32-WROOM-32UE, and other components as shown in the circuit diagram (provide the diagram or reference it here).</li>
<li><b>Software Setup:</b>
   <ul>
   <li>Install the required libraries for both the Arduino and ESP32.</li>
   <li>Upload the Arduino code to the Arduino Nano 33 BLE Sense.</li>
   <li>Upload the ESP32 code to the ESP32-WROOM-32UE.</li>
   </ul>
</li>
<li><b>MQTT Broker:</b> Set up an MQTT broker (e.g., Mosquitto) and configure the devices to connect to it.</li>
<li><b>Cloud Database (Optional):</b> Set up a cloud database (e.g., Firebase) for data storage and remote access.</li>
</ol>

<h2 id="usage">Usage</h2>

<ol>
<li><b>Power On:</b> Turn on both the Arduino and ESP32 modules.</li>
<li><b>Gesture Control:</b> Perform hand gestures in front of the Arduino to control connected smart home devices.</li>
<li><b>Remote Control (Optional):</b> Use a web interface or mobile app to control the system remotely via the cloud.</li>
<li><b>Data Monitoring (Optional):</b> Access the cloud database to view and analyze collected sensor data.</li>
</ol>

<h2 id="contributing">Contributing</h2>

<p>
Contributions to this project are welcome! If you have any ideas, bug fixes, or feature enhancements, please feel free to submit a pull request.
</p>

</body>

</html>