let clientMqtt;

let inflightZipData = 0;
let totalZipFiles   = 0;
let totalRenderingZipFiles = 0;
let pendingZipSend  = 0;
let pendingUnzipFile= 0;
// let totalUnzipFiles = 0;
let zipInMotion = false;

const S3_EDGE           = 4.75
const S3_CENTRAL        = 17.75
const S3_CENTRAL_MODELS = 26.75

let pipeTimerInterval = null;

var monitorQueue = [] 

function initMqtt(){


    var brokerHost = window.location.hostname.replace("camel-edge", "broker-amq-mqtt")
    // var brokerHost = window.location.hostname.replace("camel-edge", "broker-amq-hdls-svc")
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
        // brokerOptions = {useSSL:true,onSuccess:onConnect, onFailure:onFailure, onMessageArrived: onMessageArrived, onConnectionLost: onConnectionLost}
        brokerOptions = {useSSL:true,onSuccess:onConnect, onFailure:onFailure}
    }
    
    let uid = Date.now().toString(36) + Math.random().toString(36).substr(2)

    // Create a client instance
    // clientMqtt = new Paho.MQTT.Client(brokerHost, Number(brokerPort), "MonitorClient");
    clientMqtt = new Paho.MQTT.Client(brokerHost, Number(brokerPort), "MonitorClient-"+uid);
    // clientMqtt = new Paho.MQTT.Client(brokerHost, Number(brokerPort));
    
    // set callback handlers
    clientMqtt.onConnectionLost = onConnectionLost;
    // clientMqtt.onMessageArrived = onMessageArrived;
    
    // connect the client
    clientMqtt.connect(brokerOptions);

    // Reconnect mechanism in case MQTT connection is lost
    const interval = setInterval(function() {
      if(!clientMqtt.isConnected()){
          console.log("MQTT: attempting reconnect.");
          //somehow this field is automatically created on first connect
          //we need to remove it, otherwise it won't reconnect.
          delete brokerOptions.mqttVersionExplicit
          clientMqtt.connect(brokerOptions);
      }
      // method to be executed;
    }, 1000);
}

// called when the MQTT client connects
function onConnect() {
    console.log("MQTT: connected to broker");
    clientMqtt.onMessageArrived = onMessageArrived;
    clientMqtt.subscribe("monitor", 1);
}

function onConnectionLost(responseObject){
    console.log("MQTT: connection lost");
}

function onFailure(responseObject){
    console.log("MQTT: failure");
}

function onMessageArrived(msg){
    console.log("MQTT message: "+msg.payloadString);

    let message = JSON.parse(msg.payloadString)

    console.log("MQTT message: "+message.origin);

    //When message is an MQTT inference response
    if(message.origin == "mqtt"){
        consumeMqttEvent(num++, message)
    }
    //For monitoring events
    else{
      processMqttMonitorMessage(message)
    }
}

function processMqttMonitorMessage(message){

    //When message is an MQTT inference response
    if(message.origin == "mqtt"){
        consumeMqttEvent(num++, message)
    }
    //For monitoring events
    else{
      console.log("name: "+message.name);

      //No queuing for detection/ingestion
      if(message.name == "detection"){
        // consumeHttpEvent("1", process)
        consumeHttpEvent(num++, message)
      }
      else if(message.name == "ingestion"){
        renderEventIngestion(num++, message)
      }


      else if(message.name == "zipdata"){
        renderEventZipData(num++, message)
      }
      else if(message.name == "zipsend"){
        pendingZipSend++
        // renderEventZipSend(num, process)
      }
      else if(message.name == "zipfile"){
        handleZipFile(num++, message)
      }


      //Qeueuing for other monitoring messages
      else{

        if(totalZipFiles==0 && pendingZipSend==0 && monitorQueue.length == 0){
          processMonitorMessage(message)
        }
        else{
          monitorQueue.push(message)
          // processNextMonitorMessage() 
        }
      }

/*      else if(message.name == "pipeline"){
        renderPipelineStart(message.files)
      }
      else if(message.name == "pushmodel"){
        renderPipelineEnd()
      }
*/
    }

}

function processNextMonitorMessage(requestDiscard){

  if(monitorQueue.length > 0){
    let nextMessage = monitorQueue.shift()
    // let nextMessage = monitorQueue
    processMonitorMessage(nextMessage)
  }
}

/*
function processNextMonitorMessage(requestDiscard){

  //true by default unless specified
  discard = true

  if(requestDiscard == false)
    discard = false

  //true by default unless specified
  // discard = discard || true

  //discard head of queue (finished processing by calling method)
  if(discard){
    monitorQueue.shift()
  }

  if(monitorQueue.length > 0){
    // let nextMessage = monitorQueue.shift()
    let nextMessage = monitorQueue[0]
    processMonitorMessage(nextMessage)
  }
}

*/
function processMonitorMessage(message){


      console.log("name: "+message.name);

      // if(message.name == "detection"){
      //   consumeHttpEvent(num, message)
      // }
      // else if(message.name == "ingestion"){
      //   renderEventIngestion(num, message)
      // }
      // else 
/*
      if(message.name == "zipdata"){
        renderEventZipData(num, message)
      }
      else if(message.name == "zipsend"){
        pendingZipSend++
        // renderEventZipSend(num, process)
      }
      else if(message.name == "zipfile"){
        handleZipFile(num, message)
      }
      else 
*/
      if(message.name == "pipeline"){
        renderPipelineStart(message.files)
      }
      else if(message.name == "pushmodel"){
        renderPipelineEnd()
      }

      num++
}

function handleZipFile(num, process){
  console.log("### pendingZipSend: "+pendingZipSend)
  // if(pendingZipSend > 0){
  if(zipInMotion){
    pendingUnzipFile++
  }
  else{
    console.log("rendering unzip file")
    renderEventUnZip(num, process, false)
  }
}

function simZipFile(){
  // setCameraFocus(12)

  // totalZipFiles=3
  // pendingUnzipFile=3
  // createZip()
  
  handleZipFile(1,{})
}


function simPipelineStart(){

  let sim = '{"name":"pipeline", "files":"10"}'

  let message = JSON.parse(sim);
  processMqttMonitorMessage(message)

  // let numS3files=10
  // renderPipelineStart(numS3files)
}

function simPipelineEnd(){

  let sim = '{"name":"pushmodel"}'

  let message = JSON.parse(sim);
  processMqttMonitorMessage(message)
//  renderPipelineEnd()
}




function trainData() {
    const url=window.origin+"/zip"
    const Http = new XMLHttpRequest();

    Http.open("GET", url);
    Http.send();

    Http.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log(Http.responseText)
            // response = JSON.parse(Http.responseText)
            // displayProducts(response.products)
        }
    }
}

        function initWebSocket() {

        	var ws;
            
            if ("WebSocket" in window) {
               console.log("WebSocket is supported by your Browser!");
               
               // Let us open a web socket
               //var ws = new WebSocket("ws://localhost:9998/echo");
               ws = new WebSocket(((window.location.protocol === 'https:') ? 'wss://' : 'ws://') + window.location.host + '/camel/eventOffset');
             //localhost:8080/myapp/mysocket
    			
               ws.onopen = function() {
                  //nothing to do
               };
    			
               ws.onclose = function() {
                  // websocket is closed.
                  console.log("Connection is closed..."); 
               };
            } else {
               // The browser doesn't support WebSocket
               alert("WebSocket NOT supported by your Browser!");
            }

            return ws;
         }


      function startConsumer()
      {
        let scene = document.getElementById("scene");


        var zone = document.createElement('a-text')
        zone.setAttribute('value', 'Edge')
        zone.setAttribute('scale', "2 2 2")
        zone.setAttribute('align', 'center')
        zone.setAttribute('color', 'grey')
        zone.setAttribute('position', {x: -8, y:-5.2})
        scene.appendChild(zone);

        zone = document.createElement('a-text')
        zone.setAttribute('value', 'Near Edge')
        zone.setAttribute('scale', "2 2 2")
        zone.setAttribute('align', 'center')
        zone.setAttribute('color', 'grey')
        zone.setAttribute('position', {x: 2, y:-5.2})
        scene.appendChild(zone);
       
        zone = document.createElement('a-text')
        zone.setAttribute('value', 'Central Data Center')
        zone.setAttribute('scale', "2 2 2")
        zone.setAttribute('align', 'center')
        zone.setAttribute('color', 'grey')
        zone.setAttribute('position', {x: 20, y:-5.2})
        scene.appendChild(zone);

        // Camel (infer/ingest)
        let pipe = document.createElement('a-box')
        pipe.setAttribute('position', {x: 0, y: 0, z: 0})
        pipe.setAttribute('height', .7)
        pipe.setAttribute('width' , 6)
        pipe.setAttribute('depth' , .3)
        pipe.setAttribute('side', "double")
        pipe.setAttribute('color', "grey")
        pipe.setAttribute('opacity', ".5")
        
        scene.appendChild(pipe)
        
        var processor = document.createElement('a-text')
        processor.setAttribute('value', 'Camel - Infer/Ingest')
        processor.setAttribute('scale', "2 2 2")
        processor.setAttribute('align', 'center')
        processor.setAttribute('color', 'grey')
        scene.appendChild(processor);
        processor.setAttribute('position', {y: -0.7, z:.1})
      
          // Camel (collect and push)
          pipe = document.createElement('a-box')
          pipe.setAttribute('position', {x: 8, y: 0, z: 0})
          pipe.setAttribute('height', .7)
          pipe.setAttribute('width' , 3)
          pipe.setAttribute('depth' , .3)
          pipe.setAttribute('side', "double")
          pipe.setAttribute('color', "grey")
          pipe.setAttribute('opacity', ".5")
          
          scene.appendChild(pipe)
          
          var processor = document.createElement('a-text')
          processor.setAttribute('value', 'Camel - Push')
          processor.setAttribute('scale', "2 2 2")
          processor.setAttribute('align', 'center')
          processor.setAttribute('color', 'grey')
          pipe.appendChild(processor);
          processor.setAttribute('position', {y: -0.7, z:.1})


          // Camel (Model push)
          pipe = document.createElement('a-box')
          pipe.setAttribute('position', {x: 8, y: 3, z: 0})
          pipe.setAttribute('height', .7)
          pipe.setAttribute('width' , 3)
          pipe.setAttribute('depth' , .3)
          pipe.setAttribute('side', "double")
          pipe.setAttribute('color', "grey")
          pipe.setAttribute('opacity', ".5")
          
          scene.appendChild(pipe)
          
          var processor = document.createElement('a-text')
          processor.setAttribute('value', 'Camel\nModel Push')
          processor.setAttribute('scale', "1.7 1.7 1.7")
          processor.setAttribute('align', 'center')
          processor.setAttribute('color', 'grey')
          pipe.appendChild(processor);
          processor.setAttribute('position', {y: 0.8, z:.1})
        

            // Camel Central
            pipe = document.createElement('a-box')
            pipe.setAttribute('position', {x: 14.5})
            pipe.setAttribute('height', .7)
            pipe.setAttribute('width' , 3)
            pipe.setAttribute('depth' , .3)
            pipe.setAttribute('side', "double")
            pipe.setAttribute('color', "grey")
            pipe.setAttribute('opacity', ".5")
            
            scene.appendChild(pipe)
            
            var processor = document.createElement('a-text')
            processor.setAttribute('value', 'Camel - Central')
            processor.setAttribute('scale', "2 2 2")
            processor.setAttribute('align', 'center')
            processor.setAttribute('color', 'grey')
            pipe.appendChild(processor);
            processor.setAttribute('position', {y: -0.7})


                // AI Pipeline
                pipe = document.createElement('a-box')
                pipe.setAttribute('position', {x: 22, y: 0, z: 0})
                pipe.setAttribute('height', .7)
                pipe.setAttribute('width' , 5)
                pipe.setAttribute('depth' , .7)
                pipe.setAttribute('side', "double")
                pipe.setAttribute('color', "grey")
                pipe.setAttribute('opacity', ".5")
                pipe.setAttribute('id','pipe')
                
                scene.appendChild(pipe)
                
                var processor = document.createElement('a-text')
                processor.setAttribute('value', 'Tekton Pipeline')
                processor.setAttribute('scale', "2 2 2")
                processor.setAttribute('align', 'center')
                processor.setAttribute('color', 'grey')
                scene.appendChild(processor);
                processor.setAttribute('position', {x:22, y: -0.7})

                var timer = document.createElement('a-text')
                timer.setAttribute('value', 'AI/ML Training')
                timer.setAttribute('scale', "2 2 2")
                timer.setAttribute('align', 'center')
                timer.setAttribute('color', 'grey')
                scene.appendChild(timer);
                timer.setAttribute('position', {x:22, y: 0.7})
                timer.setAttribute('id','pipetimer')

      }
      
      function consumeEventArray(array)
      {        
        let delay = 0;
        
        for(var i = 0; i < array.length; i++) {
          doSetTimeout(array[i], delay+=500)
        }
      }
      
      //needs independent function to copy values into setTimeout
      function doSetTimeout(item, delay) {
        setTimeout(function(){ consumeEvent(item)}, delay);
      }
      

      function sendMessage(protocol)
      {
        let scene = document.getElementById("scene");

        let process = {
            // origin: "mqtt",
            origin: protocol,
            valid: true,
            // valid: false,
            price: 500
        }

      //   consumeEvent(item)
        // consumeMqttEvent(item, process)

        if(protocol == "mqtt")
          consumeMqttEvent(num, process)
        else if(protocol == "http")
          consumeHttpEvent(num, process)
        
        num++
      }


      function setCameraFocus(xpos, duration){

        res1 = typeof("")
        res2 = typeof({})

        console.log("test: "+res1)
        console.log("test2: "+res2)

        if(res2 == "object")
          console.log("res2 is object!")


        duration = duration || '3000'

        let camera = document.getElementById("main-camera");

        let target = {x: xpos, y:0, z:8}

        if(typeof(xpos) == "object")
          target = xpos
        
        camera.setAttribute(
            'animation',
            {  property: 'position', 
               // dur: '3000', 
               dur: duration, 
               delay: 0, 
               to: target,
               // easing: 'easeOutQuad'
               easing: 'easeInOutQuad'
            });

           //listens animation end
          camera.addEventListener('animationcomplete', function cleanAnimation(evt) {

            let pos = this.getAttribute("position").x
            
            if (pos == xpos)
            {
                //delete listener
                this.removeEventListener('animationcomplete', cleanAnimation);

                //delete animation
                this.removeAttribute('animation');
                
                //   consumeMqttEventPhase2(item, this)
                // this.parentElement.removeChild(this);
            }
          });
      }

      function consumeEvent(item)
      {
        posY = 0;
        var msg;
      
        msg = document.createElement('a-box')
        msg.setAttribute('position', {x: -10, y: posY, z: 0})
        msg.setAttribute('height', .5)
        msg.setAttribute('width' , .5)
        msg.setAttribute('depth' , .2)
        msg.setAttribute('side', "double")
        msg.setAttribute('color', "red")
        // msg.setAttribute('opacity', ".9")
        
        var number = document.createElement('a-text')
        number.setAttribute('value', item)
        number.setAttribute('align', 'center')
        number.setAttribute('scale', "2 2 2")
        msg.appendChild(number);
        number.setAttribute('position', {z: 0.148})
     
        let target = {  x: -3+.6,
                        y: posY, 
                        z: 0}
        
        msg.setAttribute(
            'animation',
            {  property: 'position', 
               dur: '1000', 
               delay: 0, 
               to: target,
               easing: 'easeOutQuad'
            });
       
        // let from = {  x: -3+.6,
        //                 y: posY, 
        //                 z: 0}
        
        let from = target;
        
        target = {  x: 3-.6,
                        y: posY, 
                        z: 0}
  
          msg.setAttribute(
            'animation__2',
            {  property: 'position', 
               dur: '3000', 
               delay: 950, 
               from: from,
               to: target,
               // easing: 'easeOutQuad'
            });

        
        
          msg.setAttribute(
            'animation__color',
            {  property: 'color', 
               dur: '3000', 
               delay: 1150, 
               // from: 'red',
               from: '#FF0000',
               to: '#00FF00',
               // easing: 'easeOutQuad'
            });
        
          
          msg.setAttribute(
            'animation__4',
            {  property: 'position', 
               dur: '1000', 
               delay: 3950, 
               from: target,
               to: "15 "+posY+" 0",
               // easing: 'easeOutQuad'
            });
          
          
          //listens animation end
          msg.addEventListener('animationcomplete', function cleanAnimation(evt) {

        	  //console.log("name detail: "+ evt.detail.name)
        	  
        	  //if (evt.detail.name = "animation__4")

        	  let pos = this.getAttribute("position").x
        	  
            if (pos == 15)
        	  {
	              //delete listener
	              this.removeEventListener('animationcomplete', cleanAnimation);
	
	              //delete animation
	              this.removeAttribute('animation');
	              
	              this.parentElement.removeChild(this);
        	  }
          }); 
          
          
          
        scene.appendChild(msg);  
        
        
      }



      function consumeMqttEvent(item, process)
      {
        posY = 0;
        var msg;
      
        msg = document.createElement('a-box')
        // msg.setAttribute('position', {x: -8, y: posY, z: 0})
        msg.setAttribute('position', {x: -8, y: 2, z: 0})
        msg.setAttribute('height', .5)
        msg.setAttribute('width' , .5)
        msg.setAttribute('depth' , .2)
        msg.setAttribute('side', "double")
        msg.setAttribute('color', "grey")
        // msg.setAttribute('opacity', ".9")
  

        var number = document.createElement('a-text')
        number.setAttribute('value', item)
        // number.setAttribute('value', "1")
        number.setAttribute('align', 'center')
        number.setAttribute('scale', "2 2 2")
        msg.appendChild(number);
        number.setAttribute('position', {z: 0.148})

        let target = {  x: -4+.6,
                        // y: posY, 
                        y: 2, 
                        z: 0}
        
        msg.setAttribute(
            'animation',
            {  property: 'position', 
               dur: '1000', 
               delay: 0, 
               to: target,
               easing: 'easeOutQuad'
            });
       
        // let from = {  x: -3+.6,
        //                 y: posY, 
        //                 z: 0}
        
        let from = target;
        
        target = {  x: -4+.6,
                        y: 0, 
                        z: 0}
  
          msg.setAttribute(
            'animation__2',
            {  property: 'position', 
               dur: '1000', 
               delay: 950, 
               from: from,
               to: target,
               // easing: 'easeOutQuad'
            });


            from = target;
        
            // target = {  x: 4-.6,
            target = {  x: 0,
                            y: 0, 
                            z: 0}
      
              msg.setAttribute(
                'animation__3',
                {  property: 'position', 
                   dur: '2000', 
                   delay: 1950, 
                   from: from,
                   to: target,
                   // easing: 'easeOutQuad'
                });
        
        /*
          msg.setAttribute(
            'animation__color',
            {  property: 'color', 
               dur: '3000', 
               delay: 1150, 
               // from: 'red',
               from: '#FF0000',
               to: '#00FF00',
               // easing: 'easeOutQuad'
            });
        
          
          msg.setAttribute(
            'animation__4',
            {  property: 'position', 
               dur: '1000', 
               delay: 3950, 
               from: target,
               to: "15 "+posY+" 0",
               // easing: 'easeOutQuad'
            });
          */
          
          //listens animation end
          msg.addEventListener('animationcomplete', function cleanAnimation(evt) {

        	  //console.log("name detail: "+ evt.detail.name)
        	  
        	  //if (evt.detail.name = "animation__4")

        	  let pos = this.getAttribute("position").x
        	  
            // if (pos == 15)
            if (pos == 0)
        	  {
	              //delete listener
	              this.removeEventListener('animationcomplete', cleanAnimation);
	
	              //delete animation
	              this.removeAttribute('animation');
	              
                  consumeMqttEventPhase2(item, this, process)
	            //   this.parentElement.removeChild(this);
        	  }
          }); 
 
        scene.appendChild(msg);        
      }
      


      function consumeHttpEvent(item, process)
      {
        posY = 0;
        var msg;
      
        msg = document.createElement('a-box')
        // msg.setAttribute('position', {x: -8, y: posY, z: 0})
        msg.setAttribute('position', {x: -8, y: 0, z: 0})
        msg.setAttribute('height', .5)
        msg.setAttribute('width' , .5)
        msg.setAttribute('depth' , .2)
        msg.setAttribute('side', "double")
        msg.setAttribute('color', "grey")
        // msg.setAttribute('opacity', ".9")


        var number = document.createElement('a-text')
        number.setAttribute('value', item)
        // number.setAttribute('value', "1")
        number.setAttribute('align', 'center')
        number.setAttribute('scale', "2 2 2")
        msg.appendChild(number);
        number.setAttribute('position', {z: 0.148})

        let target = {  x: -4+.6,
                        // y: posY, 
                        y: 0, 
                        z: 0}
        
        msg.setAttribute(
            'animation',
            {  property: 'position', 
               dur: '1000', 
               delay: 0, 
               to: target,
               easing: 'easeOutQuad'
            });
       

            from = target;
        
            // target = {  x: 4-.6,
            target = {  x: 0,
                            y: 0, 
                            z: 0}
      
              msg.setAttribute(
                'animation__2',
                {  property: 'position', 
                   dur: '2000', 
                   delay: 950, 
                   from: from,
                   to: target,
                   // easing: 'easeOutQuad'
                });
        

          
          //listens animation end
          msg.addEventListener('animationcomplete', function cleanAnimation(evt) {

            console.log("name detail: "+ evt.detail.name)
        	  // console.log("event detail: "+ evt)
        	  
        	  //if (evt.detail.name = "animation__4")

        	  let pos = this.getAttribute("position").x
        	  
            // if (pos == 15)
            if (pos == 0)
        	  {
	              //delete listener
	              this.removeEventListener('animationcomplete', cleanAnimation);
	
	              //delete animation
	              this.removeAttribute('animation');
	              
                  consumeMqttEventPhase2(item, this, process)
	            //   this.parentElement.removeChild(this);
        	  }
          }); 
 
        scene.appendChild(msg);        
      }
      

      //Renders events going to the AI engine
      function consumeMqttEventPhase2(item, msgOriginal, process)
      {
        posY = 0;
        var msg;

        msg = document.createElement('a-box')
        // msg.setAttribute('position', {x: -8, y: posY, z: 0})
        msg.setAttribute('position', {x: 0, y: 0, z: 0})
        msg.setAttribute('height', .5)
        msg.setAttribute('width' , .5)
        msg.setAttribute('depth' , .2)
        msg.setAttribute('side', "double")
        msg.setAttribute('color', "grey")
        // msg.setAttribute('color', "red")
        // msg.setAttribute('opacity', ".9")


        var number = document.createElement('a-text')
        number.setAttribute('value', item)
        // number.setAttribute('value', "2")
        number.setAttribute('align', 'center')
        number.setAttribute('scale', "2 2 2")
        msg.appendChild(number);
        number.setAttribute('position', {z: 0.148})
     
        let target = {  x: 0,
                        // y: posY, 
                        y: 3, 
                        z: 0}
        
        msg.setAttribute(
            'animation',
            {  property: 'position', 
               dur: '1000', 
               delay: 0, 
               to: target,
               easing: 'easeOutQuad'
            });
       
          
          //listens animation end
          msg.addEventListener('animationcomplete', function cleanAnimation(evt) {


        	  let pos = this.getAttribute("position").x
        	  
            // if (pos == 15)
            if (pos == 0)
        	  {
	              //delete listener
	              this.removeEventListener('animationcomplete', cleanAnimation);
	
	              //delete animation
	              this.removeAttribute('animation');
	              
	              this.parentElement.removeChild(this);
                  aiResult(item, msgOriginal, process)
                //   consumeMqttEventPhase3(item, msgOriginal)

                  if(process.valid){
                        queryPrice(item, msgOriginal, process)
                  }
                  else{
                      consumeMqttEventPhase3(item, msgOriginal, process)
                  }
        	  }
          }); 
          
        scene.appendChild(msg);  
       
      }


      function aiResult(item, msgOriginal, process)
      {
        posY = 0;
        let msg;

        msg = document.createElement('a-image')
        // msg.setAttribute('position', {x: -8, y: posY, z: 0})
        // msg.setAttribute('position', {x: 1.5, y: 3, z: 0})
        msg.setAttribute('position', {x: 2, y: 3, z: 0})

        if(process.valid){
            msg.setAttribute('src', "#valid")
        }
        else{
            msg.setAttribute('src', "#invalid")
        }
        
        msg.setAttribute('scale', ".8 .8 .8")

        var number = document.createElement('a-text')
        // number.setAttribute('value', item)
        
        if(process.valid){
            number.setAttribute('value', "valid")
        }
        else{
            number.setAttribute('value', "invalid")
        }
        
        number.setAttribute('position', {x: .5, y: 0, z: 0})
        // number.setAttribute('align', 'center')
        number.setAttribute('scale', "4 4 4")
        msg.appendChild(number);
        // number.setAttribute('position', {z: 0.148})
     
        // let target = {  x: 1,
        //                 // y: posY, 
        //                 y: 6, 
        //                 z: 0}
        
        let target = {  
            x: 0,
            y: 0, 
            z: 0}

        msg.setAttribute(
            'animation',
            // {  property: 'position', 
            // {  property: 'scale', 
            {  property: 'opacity', 
               dur: '2000', 
               delay: 0, 
              //  to: target,
              from: 1,
              to: 0,
               easing: 'easeOutQuad'
            });
       
            //text label child
            msg.firstChild.setAttribute(
              'animation',
              {  property: 'opacity', 
                 dur: '2000', 
                 delay: 0, 
                from: 1,
                to: 0,
                 easing: 'easeOutQuad'
              });

          
          //listens animation end
          msg.addEventListener('animationcomplete', function cleanAnimation(evt) {

        	  let pos = this.getAttribute("scale").y
        	  
            // if (pos == 15)
            // if (pos == 6)
            // if (pos == 0)
        	  {
	              //delete listener
	              this.removeEventListener('animationcomplete', cleanAnimation);
	
	              //delete animation
	              this.removeAttribute('animation');
	              
	              this.parentElement.removeChild(this);
                  consumeMqttEventPhase3(item, msgOriginal, process)

        	  }
          }); 
          
        scene.appendChild(msg);  
       
      }


      //Renders events going to the AI engine
      function queryPrice(item, msgOriginal, process)
      {
        posY = 0;
        let msg;

        msg = document.createElement('a-box')
        // msg.setAttribute('position', {x: -8, y: posY, z: 0})
        msg.setAttribute('position', {x: 0, y: 0, z: 0})
        msg.setAttribute('height', .5)
        msg.setAttribute('width' , .5)
        msg.setAttribute('depth' , .2)
        msg.setAttribute('side', "double")
        msg.setAttribute('color', "grey")
        // msg.setAttribute('opacity', ".9")
        
        var number = document.createElement('a-text')
        number.setAttribute('value', item)
        // number.setAttribute('value', "2")
        number.setAttribute('align', 'center')
        number.setAttribute('scale', "2 2 2")
        msg.appendChild(number);
        number.setAttribute('position', {z: 0.148})
    
        let target = {  x: 0,
                        // y: posY, 
                        y: -3, 
                        z: 0}
        
        msg.setAttribute(
            'animation',
            {  property: 'position', 
               dur: '1000', 
               delay: 0, 
               to: target,
               easing: 'easeOutQuad'
            });
       
          
          //listens animation end
          msg.addEventListener('animationcomplete', function cleanAnimation(evt) {


        	  let pos = this.getAttribute("position").y
        	  
            // if (pos == 15)
            // if (pos == -3)
        	  {
	              //delete listener
	              this.removeEventListener('animationcomplete', cleanAnimation);
	
	              //delete animation
	              this.removeAttribute('animation');
	              
	              this.parentElement.removeChild(this);
                  consumeMqttEventPhase3(item, msgOriginal, process)
                  priceResult(item, msgOriginal, process)
                //   consumeMqttEventPhase3(item, msgOriginal)
        	  }
          }); 

        scene.appendChild(msg);
      }


      function priceResult(item, msgOriginal, process)
      {
        posY = 0;
        var msg;

        // msg = document.createElement('a-image')
        msg = document.createElement('a-entity')
        // msg.setAttribute('position', {x: -8, y: posY, z: 0})
        msg.setAttribute('position', {x: .5, y: -3, z: 0})
        // msg.setAttribute('src', "#valid")
        // msg.setAttribute('scale', ".5 .5 .5")

        var number = document.createElement('a-text')
        // number.setAttribute('value', item)
        number.setAttribute('value', process.price)
        number.setAttribute('position', {x: 0.5, y: 0, z: 0})
        // number.setAttribute('align', 'center')
        number.setAttribute('color', "yellow")
        number.setAttribute('scale', "4 4 4")
        msg.appendChild(number);
        // number.setAttribute('position', {z: 0.148})
     
        let target = {  x: 0,
                        // y: posY, 
                        y: 0, 
                        z: 0}
        
        msg.setAttribute(
            'animation',
            // {  property: 'scale', 
            {  property: 'opacity', 
               dur: '5000', 
               delay: 0, 
              //  to: target,
              from: 1, to: 0,
               easing: 'easeOutQuad'
            });
       
            //text label child
            msg.firstChild.setAttribute(
              'animation',
              {  property: 'opacity', 
                 dur: '5000', 
                 delay: 0, 
                from: 1,
                to: 0,
                 easing: 'easeOutQuad'
              });
          
          //listens animation end
          msg.addEventListener('animationcomplete', function cleanAnimation(evt) {

        	//   let pos = this.getAttribute("position").z
        	  let pos = this.getAttribute("scale").z
        	  
            // if (pos == 15)
            if (pos == 0)
        	  {
	              //delete listener
	              this.removeEventListener('animationcomplete', cleanAnimation);
	
	              //delete animation
	              this.removeAttribute('animation');
	              
	              this.parentElement.removeChild(this);
                  consumeMqttEventPhase3(item, msgOriginal, process)
        	  }
          }); 
          
        scene.appendChild(msg);  
       
      }


      function consumeMqttEventPhase3(item, msg, process)
      {
        posY = 0;
        // var msg;
   
        // msg.firstChild.setAttribute('value', "3")


            let from = {  x: 0,
                            y: 0, 
                            z: 0}
                    
            if(process.name == "ingest"){
              from.x = -4+.6
            }

            target = {  x: 4-.6,
                y: 0, 
                z: 0}


              msg.setAttribute(
                'animation',
                {  property: 'position', 
                   dur: '2000', 
                   delay: 0, 
                   from: from,
                   to: target,
                   // easing: 'easeOutQuad'
                });
        
            //default red (invalid)
            let color = '#FF0000'

            if(process.valid){
                color = '#00FF00'
            }

          msg.setAttribute(
            'animation__color',
            {  property: 'color', 
               dur: '2000', 
               delay: 0, 
               // from: 'red',
            //    from: '#FF0000',
               from: '#808080',
            //    to: '#00FF00',
               to: color,
               // easing: 'easeOutQuad'
            });
        
          
          // posY = 2
          posY = 1.5

          // let to = {
          //   x: 8,
          //   y: -2, 
          //   z: 0
          // }

          let to = {
            x: S3_EDGE,
            y: -1.5, 
            z: 0
          }


          if(process.valid){
            // to.y = 2
            to.y = 1.5
          }

          msg.setAttribute(
            'animation__2',
            {  property: 'position', 
               dur: '1000', 
               delay: 1950, 
               from: target,
            //    to: "8 "+posY+" 0",
               to: to,
            //    to: "15 "+posY+" 0",
               // easing: 'easeOutQuad'
            });
          
          
          //listens animation end
          msg.addEventListener('animationcomplete', function cleanAnimation(evt) {

        	  //console.log("name detail: "+ evt.detail.name)
        	  
        	  //if (evt.detail.name = "animation__4")

        	  let pos = this.getAttribute("position").x
        	  
            if (pos == S3_EDGE)
            // if (pos == 15)
            // if (pos == 0)
        	  {
	              //delete listener
	              this.removeEventListener('animationcomplete', cleanAnimation);
	
	              //delete animation
	              this.removeAttribute('animation');
	              
                //   consumeMqttEventPhase2(item, this)
	              this.parentElement.removeChild(this);
        	  }
          }); 
 
        // scene.appendChild(msg);        
      }


      function renderEventIngestion(item, process)
      {
        posY = 0;
        var msg;
      
        msg = document.createElement('a-box')
        // msg.setAttribute('position', {x: -8, y: posY, z: 0})
        msg.setAttribute('position', {x: -8, y: 0, z: 0})
        msg.setAttribute('height', .5)
        msg.setAttribute('width' , .5)
        msg.setAttribute('depth' , .2)
        msg.setAttribute('side', "double")
        msg.setAttribute('color', "#00FF00")
        // msg.setAttribute('opacity', ".9")


        var number = document.createElement('a-text')
        number.setAttribute('value', item)
        // number.setAttribute('value', "1")
        number.setAttribute('align', 'center')
        number.setAttribute('scale', "2 2 2")
        msg.appendChild(number);
        number.setAttribute('position', {z: 0.148})

        let target = {  x: -4+.6,
                        // y: posY, 
                        y: 0, 
                        z: 0}
        
        msg.setAttribute(
            'animation',
            {  property: 'position', 
               dur: '1000', 
               delay: 0, 
               to: target,
               easing: 'easeOutQuad'
            });
       

            from = target;
        
            target = {  x: 4-.6,
            // target = {  x: 0,
                            y: 0, 
                            z: 0}
      
              msg.setAttribute(
                'animation__2',
                {  property: 'position', 
                   dur: '2000', 
                   delay: 950, 
                   from: from,
                   to: target,
                   // easing: 'easeOutQuad'
                });
           
  
          posY = 1.5

          let to = {
            x: S3_EDGE,
            y: -1.5, 
            z: 0
          }

          if(process.valid){
            to.y = 1.5
          }

          msg.setAttribute(
            'animation__3',
            {  property: 'position', 
               dur: '1000', 
               delay: 2950, 
               from: target,
            //    to: "8 "+posY+" 0",
               to: to,
            //    to: "15 "+posY+" 0",
               // easing: 'easeOutQuad'
            });
          
          
          //listens animation end
          msg.addEventListener('animationcomplete', function cleanAnimation(evt) {

            //console.log("name detail: "+ evt.detail.name)
            
            //if (evt.detail.name = "animation__4")

            let pos = this.getAttribute("position").x
            
            if (pos == S3_EDGE)
            // if (pos == 15)
            // if (pos == 0)
            {
                //delete listener
                this.removeEventListener('animationcomplete', cleanAnimation);
  
                //delete animation
                this.removeAttribute('animation');
                
                //   consumeMqttEventPhase2(item, this)
                this.parentElement.removeChild(this);
            }
          });       
        scene.appendChild(msg);        
      }

      function createZip(){
        zipInMotion = true;
        let msg
        msg = document.createElement('a-box')
        // msg = document.getElementById('zipbox')
        msg.setAttribute('position', {x: 9.5-.3, y: 0, z: 0})
        msg.setAttribute('height', .5)
        msg.setAttribute('width' , .5)
        msg.setAttribute('depth' , .2)
        msg.setAttribute('side', "double")
        msg.setAttribute('color', "#00FF00")
        msg.setAttribute('id', "zipbox")

        var number = document.createElement('a-text')
        number.setAttribute('value', "ZIP")
        // number.setAttribute('value', "1")
        number.setAttribute('align', 'center')
        number.setAttribute('scale', "2 2 2")
        msg.appendChild(number);
        number.setAttribute('position', {x:-.05, y:-.5, z: 0})

        scene.appendChild(msg);
      }

      function renderEventZipData(item, process)
      {
        // if(inflightZipData==0){
        if(document.getElementById("zipbox") == null){
          createZip()
        }

        inflightZipData++
        totalZipFiles++
        totalRenderingZipFiles++

        posY = 0;
        var msg;
      
        setCameraFocus(8)

        msg = document.createElement('a-box')
        // msg.setAttribute('position', {x: -8, y: posY, z: 0})
        msg.setAttribute('position', {x: S3_EDGE, y: 1.5, z: 0})
        msg.setAttribute('height', .5)
        msg.setAttribute('width' , .5)
        msg.setAttribute('depth' , .2)
        msg.setAttribute('side', "double")
        msg.setAttribute('color', "#00FF00")
        // msg.setAttribute('opacity', ".9")

        var number = document.createElement('a-text')
        number.setAttribute('value', item)
        // number.setAttribute('value', "1")
        number.setAttribute('align', 'center')
        number.setAttribute('scale', "2 2 2")
        msg.appendChild(number);
        number.setAttribute('position', {z: 0.148})

        let target = {  x: 6+.6,
                        // y: posY, 
                        y: 0, 
                        z: 0}
        
        msg.setAttribute(
            'animation',
            {  property: 'position', 
               dur: '1000', 
               delay: 0, 
               to: target,
               easing: 'easeOutQuad'
            });
       

            from = target;
        
            // target = {  x: 9.5-.6,
            target = {  x: 9.5-.3,
            // target = {  x: 0,
                            y: 0, 
                            z: 0}
      
              msg.setAttribute(
                'animation__2',
                {  property: 'position', 
                   dur: '2000', 
                   delay: 950, 
                   from: from,
                   to: target,
                   easing: 'easeOutQuad'
                });
           
         
          //listens animation end
          msg.addEventListener('animationcomplete', function cleanAnimation(evt) {

            let pos = this.getAttribute("position").x
            
            // if (pos == 9.5-.6)
            if (pos == 9.5-.3)
            {
                inflightZipData--

                // if(inflightZipData == 0 && pendingZipSend){
                //   renderEventZipSend(item, process)
                // }
                //delete listener
                this.removeEventListener('animationcomplete', cleanAnimation);
  
                //delete animation
                this.removeAttribute('animation');
                

                // if(inflightZipData == 0 && pendingZipSend){
                if(inflightZipData == 0){
                  renderEventZipSend(item, process, this)
                }
                else{

                //   consumeMqttEventPhase2(item, this)
                this.parentElement.removeChild(this);
                }
            }
          });       
        scene.appendChild(msg);        
      }



      function renderEventZipSend(item, process, destroy)
      {
        posY = 0;
        var msg;

        msg = document.getElementById('zipbox')

/*
        msg = document.createElement('a-box')
        msg.setAttribute('position', {x: 9.5-.3, y: 0, z: 0})
        msg.setAttribute('height', .5)
        msg.setAttribute('width' , .5)
        msg.setAttribute('depth' , .2)
        msg.setAttribute('side', "double")
        msg.setAttribute('color', "#00FF00")
        msg.setAttribute('id', "zipsend")

        var number = document.createElement('a-text')
        // number.setAttribute('value', item)
        number.setAttribute('value', "ZIP")
        // number.setAttribute('value', "1")
        number.setAttribute('align', 'center')
        number.setAttribute('scale', "2 2 2")
        msg.appendChild(number);
        number.setAttribute('position', {x:-.05, y:-.5, z: 0})
*/
        // let target = {  x: 9+.6,
        let target = {  x: 13,
                        // y: posY, 
                        y: 0, 
                        z: 0}
        
        msg.setAttribute(
            'animation',
            {  property: 'position', 
               dur: '3000', 
               delay: 0, 
               to: target,
               easing: 'easeInOutQuad'
               // easing: 'easeInOutCubic'
               // easing: 'easeInOutCirc'
            });

        setCameraFocus(13)
       
/*
            from = target;
        
            target = {  x: 13,
            // target = {  x: 0,
                            y: 0, 
                            z: 0}
      
              msg.setAttribute(
                'animation__2',
                {  property: 'position', 
                   dur: '2000', 
                   delay: 950, 
                   from: from,
                   to: target,
                   // easing: 'easeOutQuad'
                });
*/           
         
          //listens animation end
          msg.addEventListener('animationcomplete', function cleanAnimation(evt) {

            let pos = this.getAttribute("position").x
            
            if (pos == 13)
            {
                pendingZipSend--

                //delete listener
                this.removeEventListener('animationcomplete', cleanAnimation);
  
                //delete animation
                this.removeAttribute('animation');
                
                // this.parentElement.removeChild(this);
            zipInMotion = false;

                if(pendingUnzipFile > 0){
                  // pendingUnzipFile--
                  // renderEventUnZip(item, process)
                  resumeUnzipAnimations(item, process)
                }
            }
          });       
        // scene.appendChild(msg);

        destroy.parentElement.removeChild(destroy);
      }

      function resumeUnzipAnimations(item, process){
        // n = totalZipFiles
        n = pendingUnzipFile

        for(i=0; i<n; i++){
          renderEventUnZip(item++, process)
        }
      }

      function renderEventUnZip(item, process)//, noZipOnFlight)
      {
        posY = 0;
        var msg;
      
        // if(totalZipFiles>0){
        if(totalRenderingZipFiles>0){
          // totalZipFiles--
          totalRenderingZipFiles--
        }

        // if(totalZipFiles == 0){
        if(totalRenderingZipFiles == 0){
          msg = document.getElementById('zipbox')
          if(msg){
            msg.parentElement.removeChild(msg);
          }
        }

        msg = document.createElement('a-box')
        // msg = document.getElementById('zipbox')
        msg.setAttribute('position', {x: 13, y: 0, z: 0})
        msg.setAttribute('height', .5)
        msg.setAttribute('width' , .5)
        msg.setAttribute('depth' , .2)
        msg.setAttribute('side', "double")
        msg.setAttribute('color', "#00FF00")


        var number = document.createElement('a-text')
        number.setAttribute('value', item)
        // number.setAttribute('value', "1")
        number.setAttribute('align', 'center')
        number.setAttribute('scale', "2 2 2")
        msg.appendChild(number);
        number.setAttribute('position', {x:-.05, y:-.5, z: 0})

        // let target = {  x: 9+.6,
        let target = {  x: 16,
                        // y: posY, 
                        y: 0, 
                        z: 0}
        
        msg.setAttribute(
            'animation',
            {  property: 'position', 
               dur: '3000', 
               delay: 0, 
               to: target,
               easing: 'easeInOutQuad'
               // easing: 'easeInOutCubic'
               // easing: 'easeInOutCirc'
            });
       

            from = target;
        
            target = {  x: S3_CENTRAL,
            // target = {  x: 0,
                            y: 1.5, 
                            z: 0}
      
              msg.setAttribute(
                'animation__2',
                {  property: 'position', 
                   dur: '2000', 
                   delay: 3000, 
                   from: from,
                   to: target,
                   // easing: 'easeOutQuad'
                });
           
         
          //listens animation end
          msg.addEventListener('animationcomplete', function cleanAnimation(evt) {

            let pos = this.getAttribute("position").x
            
            if (pos == S3_CENTRAL)
            {
                //delete listener
                this.removeEventListener('animationcomplete', cleanAnimation);
  
                //delete animation
                this.removeAttribute('animation');
                
                //   consumeMqttEventPhase2(item, this)
                this.parentElement.removeChild(this);

                if(pendingUnzipFile > 0){
                  pendingUnzipFile--
                  // renderEventUnZip(item, process)
                }

                if(totalZipFiles>0){
                  totalZipFiles--
                }

                if(totalZipFiles==0 && pendingUnzipFile == 0){
                  processNextMonitorMessage(false)
                }
            }
          });       
        scene.appendChild(msg);
      }


      function renderPipelineStart(numS3files){
        setCameraFocus(22)

        let signal = document.getElementById('signal');

        signal.setAttribute("visible", true)
        signal.firstElementChild.setAttribute("visible", true)

        signal.setAttribute(
          'animation',
            { property: 'opacity', 
              dur: '2000',
              from: 1,
              to: 0
            });

        signal.firstElementChild.setAttribute(
          'animation',
            { property: 'opacity', 
              dur: '2000',
              from: 1,
              to: 0
            });

        let pipe = document.getElementById('pipe');

        pipe.setAttribute('opacity', .9)

        pipe.setAttribute(
          'animation',
            { property: 'rotation', 
              dur: '3000',
              from: "0 0 0",
              to: "360 0 0",
              loop: true,
              easing: 'linear'
            });

        var time = 0;
        pipeTimerInterval = setInterval(() => {
          let timer = document.getElementById('pipetimer')
          timer.setAttribute('value', time+' seconds');
          time++;
        }, 1000);


        // let num = 10
        for(let i=0; i<numS3files; i++)
          renderPipelineFile(num++)
      }



      function renderPipelineFile(item)
      {
        var msg;
      
        msg = document.createElement('a-box')
        msg.setAttribute('position', {x: S3_CENTRAL, y: 1.5, z: 0})
        msg.setAttribute('height', .5)
        msg.setAttribute('width' , .5)
        msg.setAttribute('depth' , .2)
        msg.setAttribute('side', "double")
        msg.setAttribute('color', "#00FF00")

        var number = document.createElement('a-text')
        number.setAttribute('value', item)
        number.setAttribute('align', 'center')
        number.setAttribute('scale', "2 2 2")
        msg.appendChild(number);
        number.setAttribute('position', {z: 0.148})

        let target = {  x: 19.5,
                        y: 0, 
                        z: 0}

        msg.setAttribute(
            'animation',
            {  property: 'position', 
               dur: '3000', 
               delay: 1000, 
               to: target,
               easing: 'easeOutQuad'
            });
       
         
          //listens animation end
          msg.addEventListener('animationcomplete', function cleanAnimation(evt) {

            let pos = this.getAttribute("position").x
            
            // if (pos == 9.5-.6)
            // if (pos == 9.5-.3)
            {
                //delete listener
                this.removeEventListener('animationcomplete', cleanAnimation);
  
                //delete animation
                this.removeAttribute('animation');

                //delete box
                this.parentElement.removeChild(this);

                //process next event
                //processNextMonitorMessage()
            }
          });       
        scene.appendChild(msg);        
      }

      function renderPipelineEnd(){

        renderPipelineModelReady(num++)
        renderPipelineModelRepository(num++)
      }

      function renderPipelineModelReady(item)
      {
        var msg;
      
        msg = document.createElement('a-sphere')
        msg.setAttribute('position', {x: 24.5, y: 0, z: 0})
        msg.setAttribute('radius', .3)
        msg.setAttribute('side', "double")
        // msg.setAttribute('color', "#00FF00")
        msg.setAttribute('color', "lightskyblue")
        msg.setAttribute('opacity', .7)


        var label = document.createElement('a-text')
        label.setAttribute('value', 'M')
        label.setAttribute('align', 'center')
        label.setAttribute('scale', "2 2 2")
        msg.appendChild(label);

        label = document.createElement('a-text')
        label.setAttribute('value', 'New\nModel')
        label.setAttribute('align', 'center')
        label.setAttribute('scale', "2 2 2")
        label.setAttribute('position', {y:.9})
        msg.appendChild(label);

        let target = {  x: S3_CENTRAL_MODELS,
                        y: 1.5, 
                        z: 0}
        
        msg.setAttribute(
            'animation',
            {  property: 'position', 
               dur: '3000', 
               delay: 0, 
               to: target,
               easing: 'easeInOutQuad'
            });
       
        let from = target
        target = {  x: S3_CENTRAL_MODELS,
                        y: 3, 
                        z: 0}

        msg.setAttribute(
            'animation__2',
            {  property: 'position', 
               dur: '1000', 
               delay: 3000, 
               from: from,
               to: target,
               easing: 'easeInOutQuad'
            });

        from = target
        target = {  x: 9.5,
                        y: 3, 
                        z: 0}

        msg.setAttribute(
            'animation__3',
            {  property: 'position', 
               dur: '2000', 
               delay: 4000, 
               from: from,
               to: target,
               easing: 'easeInOutQuad'
            });
         

        from = target
        target = {  x: 6.5,
                        y: 3, 
                        z: 0}

        msg.setAttribute(
            'animation__4',
            {  property: 'position', 
               dur: '2000', 
               delay: 6000, 
               from: from,
               to: target,
               easing: 'easeInOutQuad'
            });
 
        from = target
        target = {  x: 0,
                        y: 3, 
                        z: 0}

        msg.setAttribute(
            'animation__5',
            {  property: 'position', 
               dur: '2000', 
               delay: 8000, 
               from: from,
               to: target,
               easing: 'easeInOutQuad'
            });

        ai = document.getElementById('imgai')       
        ai.setAttribute(
            'animation',
            {  property: 'scale', 
               dur: '1000', 
               delay: 10000, 
               from: "2 2 2",
               to: "2.5 2.5 2.5",
               dir: 'alternate',
               loop: 2,
               easing: 'easeInOutQuad'
            });

          //listens animation end
          ai.addEventListener('animationcomplete', function cleanAnimation(evt) {

                //delete listener
                this.removeEventListener('animationcomplete', cleanAnimation);
  
                //delete animation
                this.removeAttribute('animation');
          }); 

          //listens animation end
          msg.addEventListener('animationcomplete', function cleanAnimation(evt) {

            let pos = this.getAttribute("position").x
            
            // if (pos == 9.5-.6)
            if (pos == 0)
            {
                //delete listener
                this.removeEventListener('animationcomplete', cleanAnimation);
  
                //delete animation
                this.removeAttribute('animation');

                //delete box
                this.parentElement.removeChild(this);

                // ai = document.getElementById('imgai')       
                // ai.removeAttribute('animation')
            }
          });       
        scene.appendChild(msg);        
      }



      function renderPipelineModelRepository(item)
      {
        var msg;
      
        msg = document.createElement('a-sphere')
        msg.setAttribute('position', {x: 24.5, y: 0, z: 0})
        msg.setAttribute('radius', .3)
        msg.setAttribute('side', "double")
        // msg.setAttribute('color', "#00FF00")
        msg.setAttribute('color', "yellow")
        msg.setAttribute('opacity', .7)

        var number = document.createElement('a-text')
        number.setAttribute('value', 'M')
        number.setAttribute('align', 'center')
        number.setAttribute('scale', "2 2 2")
        msg.appendChild(number);
        // number.setAttribute('position', {z: 0.148})

        let target = {  x: S3_CENTRAL_MODELS,
                        y: -1.5, 
                        z: 0}
        
        msg.setAttribute(
            'animation',
            {  property: 'position', 
               dur: '3000', 
               delay: 0, 
               to: target,
               easing: 'easeOutQuad'
            });
       
         
          //listens animation end
          msg.addEventListener('animationcomplete', function cleanAnimation(evt) {

            let pos = this.getAttribute("position").x
            
            // if (pos == 9.5-.6)
            // if (pos == 9.5-.3)
            {
                //delete listener
                this.removeEventListener('animationcomplete', cleanAnimation);
  
                //delete animation
                this.removeAttribute('animation');

                //delete box
                this.parentElement.removeChild(this);


                //Clean animations Signal
                let signal = document.getElementById('signal');
                signal.removeAttribute('animation')
                signal.firstElementChild.removeAttribute('animation')
                signal.setAttribute("visible", false)
                signal.firstElementChild.setAttribute("visible", false)

                //Clean animations Pipe
                let pipe = document.getElementById('pipe');
                pipe.removeAttribute('animation')
                pipe.setAttribute('rotation', '0 0 0')
                pipe.setAttribute('opacity', .5)

                clearInterval(pipeTimerInterval)
                // document.getElementById('pipetimer').setAttribute('value','');

                // setCameraFocus(S3_EDGE)
                setCameraFocus(0, 6000)
            }
          });       
        scene.appendChild(msg);        
      }
