fmode = "user"

if (navigator.userAgent.match(/Android/i)
|| navigator.userAgent.match(/webOS/i)
|| navigator.userAgent.match(/iPhone/i)
|| navigator.userAgent.match(/iPad/i)
|| navigator.userAgent.match(/iPod/i)
|| navigator.userAgent.match(/BlackBerry/i)
|| navigator.userAgent.match(/Windows Phone/i)) {
    fmode = { exact: "environment"} ;
}
else{
    //reverse camera scaleX when using front camera
    var camera = document.getElementById('camera--view');
    camera.style.transform = "scaleX(-1)"
}

// Set constraints for the video stream
// var constraints = { video: { facingMode: "user" }, audio: false };
var constraints = { video: { facingMode: fmode }, audio: false };
// var constraints = { video: { facingMode: { exact: "environment"} }, audio: false };
var track = null;


// supported = false;
// const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
// for (const constraint of Object.keys(supportedConstraints)) {
//   console.log("constraint: "+constraint);

//   if(constraint == "facingMode"){
//     supported = true;
//   }
// }
// console.log("supported: "+supported);
// displayMessage("supported v2: "+supported)
// displayMessage("running v3")


//MQTT client Unique ID
let uid = Date.now().toString(36) + Math.random().toString(36).substr(2)
let mqttTopic         = "detection/" + uid;
let mqttTopicResponse =  "response/"+mqttTopic;

let clientMqtt;

// Define constants
const cameraView = document.querySelector("#camera--view"),
    cameraOutput = document.querySelector("#camera--output"),
    cameraSensor = document.querySelector("#camera--sensor"),
    cameraTrigger = document.querySelector("#camera--trigger"),
    deviceTrigger = document.querySelector("#device--trigger"),
    labelCategory = document.querySelector("#lbl-category"),
    buttonSend    = document.querySelector("#btn-send"),

    btnHttp = document.querySelector("#protocol--http"),
    btnMqtt = document.querySelector("#protocol--mqtt"),

    filePicker    = document.querySelector("#fileInput");
    productPicker = document.getElementById("product-picker")

    mode = "detection"




function setIngestionMode(){
    mode = "ingestion"
}

function setDetectionMode(){
    mode = "detection"
}

// Access the device camera and stream to cameraView
function cameraStart() {
    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function(stream) {
            track = stream.getTracks()[0];
            cameraView.srcObject = stream;
        })
        .catch(function(error) {
            console.error("Oops. Something is broken.", error);
        });
}

// Take a picture when cameraTrigger is tapped
cameraTrigger.onclick = function() {
    cameraSensor.width = cameraView.videoWidth;
    cameraSensor.height = cameraView.videoHeight;

    if(buttonSend)
        buttonSend.style.display="";


    // fwidth = 400
    // factor = fwidth/cameraSensor.width
    // fheight = cameraSensor.height * factor

    cameraSensor.getContext("2d").drawImage(cameraView, 0, 0);
    // cameraSensor.getContext("2d").drawImage(cameraView, 0, 0, fwidth, fheight);
    cameraOutput.src = cameraSensor.toDataURL("image/jpeg");
    cameraOutput.classList.add("taken");

    console.log("mode is: "+mode)

    if(mode == "detection"){
        btnHttp.hidden = false
        btnMqtt.hidden = false
    }
    else if(mode == "ingestion"){
        // sendHttpIngestionOptions(cameraOutput.src)
        //sendHttpIngestionOptions()
    }

    // sendHttp(cameraOutput.src)
    // track.stop();
};

function resizeImage(base64Str) {

    var img = new Image();
    img.src = base64Str;
    var canvas = document.createElement('canvas');
    var MAX_WIDTH = 400;
    var MAX_HEIGHT = 350;
    var width = img.width;
    var height = img.height;

    if (width > height) {
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }
    } else {
      if (height > MAX_HEIGHT) {
        width *= MAX_HEIGHT / height;
        height = MAX_HEIGHT;
      }
    }
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg");
  }


// Send via HTTP when the button is tapped
btnHttp.onclick = function() {
    sendHttpDetection(cameraOutput.src)
};

// Send via MQTT when the button is tapped
btnMqtt.onclick = function() {
    sendMqtt(cameraOutput.src)
};


// called when the MQTT client connects
function onConnect() {
    console.log("MQTT: connected to broker");
    clientMqtt.onMessageArrived = onMessageArrived;
    clientMqtt.subscribe(mqttTopicResponse, 1);
}

function onConnectionLost(responseObject){
    console.log("MQTT: connection lost");
}

function onFailure(responseObject){
    console.log("MQTT: failure");
}

function onMessageArrived(msg){
    console.log("MQTT message: "+msg.payloadString);

    let event = JSON.parse(msg.payloadString)

    // let process = {
    //     origin: "mqtt",
    //     valid: true,
    //     // valid: false,
    //     price: 500
    // }

    console.log("MQTT message: "+event.origin);

            // if(event.known == "true"){
                displayPrice(event.pricetag)
            // }
            // else{
            //     displayProducts(event.products)
            // }

    // displayPrice(process.item+": "+process.price)
}


fileInput.onchange= function(event) {

	// var image = document.getElementById('outputHttp');
	// image.src = URL.createObjectURL(event.target.files[0]);
	
    file = event.target.files[0];

    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {


        cameraOutput.src = reader.result;
 
        cameraSensor.getContext("2d").drawImage(cameraOutput, 0, 0);


        cameraOutput.classList.add("taken");
    
        btnHttp.hidden = false
        btnMqtt.hidden = false

    };
    reader.onerror = function (error) {
      console.log('Error: ', error);
    };

	// sendHttp(event.target.files[0]);

    // viaMqtt(event)
}


function sendHttpDetection(srcImage) {
    const url=window.origin+"/detection"
    sendHttp(srcImage, url)
}

function sendHttpIngestion(srcImage) {
    const url=window.origin+"/ingestion"
    sendHttp(srcImage, url)
}

function sendHttpIngestionOptions() {
    const url=window.origin+"/ingestion/options"
    const Http = new XMLHttpRequest();

    Http.open("GET", url);
    Http.send();

    Http.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log(Http.responseText)
            response = JSON.parse(Http.responseText)
            displayProducts(response.products)
        }
    }
}


function sendHttp(srcImage, url) {
  
    const Http = new XMLHttpRequest();

    Http.open("POST", url);
    Http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    reduced = resizeImage(srcImage)
    Http.send(JSON.stringify({ "image": reduced.replace("data:image/jpeg;base64,", "")}));

    Http.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log(Http.responseText)

            response = JSON.parse(Http.responseText)

            // if(response.known == "true"){
                displayPrice(response.pricetag)
            // }
            // else{
            //     displayProducts(response.products)
            // }
        }
    }	
}

function storeHttp(srcImage, product) {
  
    const Http = new XMLHttpRequest();
    const url=window.origin+"/ingestion"

    Http.open("POST", url);
    Http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    reduced = resizeImage(srcImage)
    Http.send(JSON.stringify(
        {
            "image": reduced.replace("data:image/jpeg;base64,", ""),
            "product": product
        }));

    Http.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log(Http.responseText)

            // response = JSON.parse(Http.responseText)

            // if(response.known == true){
            //     displayPrice(response.pricetag)
            // }
            // else{
            //     displayProducts(response.products)
            // }
        }
    }   
}

function displayPrice(price){
    displayMessage(price)
}

function displayMessage(message){

    var banner = document.getElementById("message--banner")
    banner.innerHTML = message
    banner.classList.add("fade-out")

    var cleanfader=setInterval(removeFader, 5000);
    function removeFader()
    {
        banner.classList.remove("fade-out")
        clearInterval(cleanfader);
    }
}

function displayProducts(products){

    if(mode != "ingestion"){
        cameraTrigger.hidden = true
    }
    deviceTrigger.hidden = true
    btnHttp.hidden = true
    btnMqtt.hidden = true

    label1 = "Product unknown."
    label2 = "Tell us which is it:"

    if(mode == "ingestion"){
        label1 = "Select category"
        label2 = "(Choose from the list)"
    }

    productPicker.style.display = "inline";

    html='<label for="lang">'+label1+'</label>'
          +'<br/>'
          +'<label for="lang">'+label2+'</label>'
          +'<br/>'
          +'<br/>'

          +'<select name="products" id="product" onchange="updateLabel(this)">'

        for (let x in products) {
            html+='<option value="'+products[x]+'">'+products[x]+'</option>'
        }

    html +='</select>'
          +'<br/>'
          +'<br/>'
          // +'<button onclick="submitProduct()">Confirm</button>'
          +'<button id="product-ok" onclick="closePicker()">Ok</button>'
    


    productPicker.innerHTML = html
}

function updateLabel(select) {
    labelCategory.innerHTML = "Training:<br>["+select.options[select.selectedIndex].value+"]"
}


function closePicker() {
    productPicker.style.display = "none";
    updateLabel(document.getElementById('product'))
    // buttonSend.style.display="";

}


function submitProduct() {

    product = document.getElementById('product').value;

    storeHttp(cameraOutput.src, product)

    displayMessage("Trank you!<br>["+product+"]")

      // console.log('submitProduct in action');
    productPicker.style.display = "none";
    // buttonSend.style.display="none";

    if(buttonSend)
            buttonSend.style.display="none";


    cameraTrigger.hidden = false

    if(mode == "detection"){
        deviceTrigger.hidden = false
        btnHttp.hidden = false
        btnMqtt.hidden = false
    }
}

function sendMqtt(srcImage) {
    reduced = resizeImage(srcImage)
    // jsonMsg = JSON.stringify({ "image": srcImage.replace("data:image/jpeg;base64,", "")})
    jsonMsg = JSON.stringify({ "image": reduced.replace("data:image/jpeg;base64,", "")})
    message = new Paho.MQTT.Message(jsonMsg);
    // message.destinationName = "detection/"+uid;
    message.destinationName = mqttTopic;
    clientMqtt.send(message);
    console.log("MQTT message sent.")
}


// Start the video stream when the window loads
window.addEventListener("load", cameraStart, false);


var brokerHost = window.location.hostname.replace("camel-edge", "broker-amq-mqtt")
var brokerPort = window.location.port 
const brokerUrl=window.location.href+"/test"

var brokerOptions = null

//For local testing: when loading the page directly on the browser
if (brokerHost == ""){
    brokerHost = "localhost"
    brokerPort = "8080"
}

//For local testing
if (brokerPort == "8080"){
	brokerPort = "1883"
	brokerOptions = {onSuccess:onConnect}
}
else{
	brokerPort = "443"
	brokerOptions = {useSSL:true,onSuccess:onConnect, onFailure:onFailure}
}


// let uid = Date.now().toString(36) + Math.random().toString(36).substr(2)

// Create a client instance
clientMqtt = new Paho.MQTT.Client(brokerHost, Number(brokerPort), "CameraClient-"+uid);

// set callback handlers
// client.onConnectionLost = onConnectionLost;
// client.onMessageArrived = onMessageArrived;

// connect the client
clientMqtt.connect(brokerOptions);

const interval = setInterval(function() {

    // console.log("checking connectivity")
    var status = document.querySelector("#mqtt-status");

    if(clientMqtt.isConnected()){
        status.style.color = 'lightgreen';
        status.parentElement.disabled=false
    }
    else{
        status.style.color = 'red';
        status.parentElement.disabled=true
        //somehow this field is automatically created on first connect
        //we need to remove it, otherwise it won't reconnect.
        delete brokerOptions.mqttVersionExplicit
        clientMqtt.connect(brokerOptions);
    }
    // method to be executed;
}, 1000);
