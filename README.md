# rhods-transfer-learning

This project contains resources to showcase a full circle continuous motion of data to capture training data, train new ML models, deploy them, serve them, and expose the service for clients to send inference requests.

   > [!WARNING]
   > This project is now deprecated. \
   > Please use instead the following repository, which is an improved version of this demo and includes deployment scripts and detailed documentation:
   > * https://github.com/brunoNetId/sp-edge-to-cloud-data-pipelines-demo

RHODS artifacts are not YAML editable, they require UI interaction. \
Although tedious and time consuming, by the end of the deployment procedure (below), you will be able to understand how the full cycle connects all the stages together (acquisition, training, delivery, inferencing).

## Tested with

* RHODS 2.5.0 provided by Red Hat
* RHO Pipelines 1.10.4 provided by Red Hat
* AMQ-Streams 2.6.0-0 provided by Red Hat
* AMQ Broker 7.11.4 provided by Red Hat
* Red Hat build of Apache Camel 4
* Camel K 1.10 provided by Red Hat

## Deployment instructions

The following list summarises the steps to deploy the demo:

1. Provision a RHODS environment
1. Create and prepare a RHODS project.
1. Create and run the AI/ML Pipeline.
1. Deliver the AI/ML model and run the ML server.
1. Create a trigger for the Pipeline.
3. Deploy the data ingestion system.
1. Test the end to end solution.

<br/>

### Provision a RHODS environment

1. Provision the following RHDP item:
   * Base RHODS on AWS: \
https://demo.redhat.com/catalog?item=babylon-catalog-prod/sandboxes-gpte.ocp4-workshop-rhods-base-aws.prod&utm_source=webapp&utm_medium=share-link

2. Log in using your environment credentials.

<br/>

### Create a RHODS project

1. Deploy an instance of Minio
  
   1. Create a new project, named `central`
   3. Under the `central` project, deploy the following YAML resource:
      * **deployment/central/minio.yaml**

1. Create necessary S3 buckets
   
   1. Open the Minio UI (2 routes: use _UI Route_)
   2. Login with `minio/minio123`
   3. Create buckets for RHODS:
      * **workbench**
   3. Create buckets for Edge-1:
      * **edge1-data**
      * **edge1-models**
      * **edge1-ready**

      <br/>

   3. [OPTIONAL] Create buckets for Edge-2: \
      (Not needed for standard demo)
      * **edge2-data**
      * **edge2-models**
      * **edge2-ready**

   **NOTE:** Achieve the same using minio API
	```
	#https://thenewstack.io/how-to-create-an-object-storage-bucket-with-minio-object-storage/
	sudo curl -o /usr/local/bin/mc https://dl.min.io/client/mc/release/linux-amd64/mc
	sudo chmod +x /usr/local/bin/mc
	mc --version

	# Apply the following command in a separate terminal
	oc port-forward $(oc get pod -l app=minio -o jsonpath="{.items[0].metadata.name}" -n central)  9000:9000
	mc alias set trainminio http://127.0.0.1:9000 minio minio123
	mc ls trainminio

	mc mb trainminio/workbench
	mc mb trainminio/edge1-data
	mc mb trainminio/edge1-models
	mc mb trainminio/edge1-ready

	mc mb trainminio/edge2-data
	mc mb trainminio/edge2-models
	mc mb trainminio/edge2-ready

	mc ls trainminio

	[2024-02-05 12:57:34 GMT]0B edge1-data/
	[2024-02-05 12:57:34 GMT]0B edge1-models/
	[2024-02-05 12:57:34 GMT]0B edge1-ready/
	[2024-02-05 12:57:47 GMT]0B edge2-data/
	[2024-02-05 12:57:47 GMT]0B edge2-models/
	[2024-02-05 12:57:48 GMT]0B edge2-ready/
	[2024-02-05 12:56:59 GMT]0B workbench/
	   
	```  

1. Create a new *Data Science Project*.

   Open *Red Hat OpenShift AI* (also known as RHODS). \
   Log in using your environment credentials. \
   Select *Data Science Projects* and click `Create data science project`. \
   As a name, use for example `tf` (TensorFlow)

1. Create a new *Data Connection*.

   Under the new `tf` project > Data connections, click `Add data connection`. \
   Enter the following parameters:
   * Name: `dc1` (data connection 1)
   * Access key: `minio` 
   * Secret key: `minio123` 
   * Endpoint: `http://minio-service.central.svc:9000` 
   * Region: `eu-west-2`
   * Bucket: `workbench`

1. Create a *Pipeline Server*.

   Under the new `tf` project > Pipelines, click `Create a pipeline server`. \
   Enter the following parameters:
   * Existing data connection: `dc1`

   Then click `Configure` to proceed.

1. Create a '*PersistentVolumeClaim*' for the pipeline.

   The PVC will enable shared storage for the pipeline's execution. \
   Deploy the following YAML resource:
      * **deployment/pipeline/pvc.yaml**

1. Create a new *Workbench*.

   Under the new `tf` project > Workbenches, click `Create workbench`. \
   Enter the following parameters:
   * Name: `wb1` (workbench 1)
   * Image selection: `TensorFlow` 
   * Container Size: `medium` 
   * Create new persistent storage
     * Name: `wb1`
     * Persistent storage size: (leave default) 
   * Use a data connection
     * Use existing data connection
       * Data connection: `dc1`

   Then click `Create workbench`

1. Open the workbench (*Jupyter*).

   When your workbench is in *Running* status, click `Open`.

   Log in using your environment credentials.

<br/>

### Create the AI/ML Pipeline

1. Upload the pipeline sources to the project tree.

   > [!CAUTION] 
   > Do not use the *'Git Clone'* feature to upload the project, you don't need to upload the big dataset of images!

   Under the *Jupyter* menu, click the icon *'Upload Files'* and select the sources listed below:

   To show the entire modelling process:
      * **workbench/clean-01.ipynb**

   To show the process segmented in pipeline steps:

      * **workbench/pipeline/step-01.ipynb**
      * **workbench/pipeline/step-02.ipynb**
      * **workbench/pipeline/step-03.ipynb**

   To show the *Elyra* pipeline definition:

      * **workbench/pipeline/retrain.pipeline**

   <br/>
   

1. Export the pipeline in a *Tekton* YAML file.
   
   > [!TIP] 
   > Reference to documented guidelines:
   > * https://docs.google.com/document/d/1kcubQQuQyJGP_grbMD6Jji8o-IBDrYBbuIOREj2dFlc/edit#heading=h.wd1fnfz39nr

   1. Double click on the `retrain.pipeline` resource. The pipeline will be displayed in *Elyra* (embedded visual pipeline editor in Jupyter).
   1. Hover and click on the icon with label `Export Pipeline`.
   1. Enter the following paramters:
      * s3endpoint: `http://minio-service.central.svc:9000` 
      * leave all other parameters with default values.
   1. Click `OK`.

   a. The action will produce a new file `retrain.yaml` file.

   b. It will also populate your S3 bucket `workbench` with your pipeline's artifacts.

1. Import the pipeline as an *OpenShift Tekton* pipeline.

   From your OpenShift UI Console, navigate to Pipelines > Pipelines.

   > [!TIP] 
   > Reference to documented guidelines:
   > * https://docs.google.com/document/d/1kcubQQuQyJGP_grbMD6Jji8o-IBDrYBbuIOREj2dFlc/edit#heading=h.pehkoctq6uk2

   Ensure you're working under the `tf` project (namespace). \
   Click `Create > Pipeline`. \
   Use the following snippet:
   ```yaml
   apiVersion: tekton.dev/v1beta1
   kind: Pipeline
   metadata:
     name: train-model
     namespace: tf
   spec:
   
     [Copy paste here contents under 'pipelineSpec']
   ```
   Complete the YAML code above with the `pipelineSpec` (around line 51) definition from your exported YAML file in Jupyter (`retrain.yaml`).
      > [!CAUTION] 
      > Make sure you un-tab one level the `pipelineSpec` definition to make the resource valid.

   Click `Create`.

   You can test the pipeline by clicking `Action > Start`, accept default values and click `Start`.

   You should see the pipeline <u>**FAIL**</u> because there is no trainable data available just yet.

1. Upload training data to S3.

   There are two options to upload training data:
   * **Manually (recommended)**: Use Minio's UI console to upload the images (training data):
     * From the project's folder:
       * dataset/images
     * To the root of the S3 bucket:
       * `edge1-data` \
       (wait for all images to be fully uploaded)
   * **Automatically**: Use the Camel server provided in the repository to push training data to S3. Follow the instructions under:
     * camel/central-feeder/Readme.txt

1. Train the model.

   When **ALL** images have been uploaded, re-run the pipeline by clicking `Action > Start`, accept default values and click `Start`.

   You should now see the pipeline succeed. It will push the new model to the following buckets:
   * `edge1-models`
   * `edge1-ready`

<br/>

### Prepare the *Edge1* environment

1. Create a new *OpenShift* project `edge1`.


1. Deploy an *AMQ Broker*
    
    AMQ is used to enable MQTT connectivity with edge devices and manage monitoring events.

    1. Install the AMQ Broker Operator:
        * AMQ Broker for RHEL 8 (Multiarch)

        Install in `edge1` namespace (specific) \
        **NOT cluster wide**
    1. Create a new ***ActiveMQ Artemis*** (amq broker instance) \
    Use the YAML defined under:
        * **deployment/edge/amq-broker.yaml**
    
    1. Create a route to enable external MQTT communication (demo Mobile App)
        ```
        oc create route edge broker-amq-mqtt --service broker-amq-mqtt-0-svc
        ```

1. Deploy a *Minio* instance on the (near) edge.

   1. In the `edge1` namespace use the following YAML resource to create the *Minio* instance:
      * **deployment/edge/minio.yaml**
   1. In the new *Minio* instance create the following buckets:
      * **production** (live AI/ML models)
      * **data** (training data)
      * **valid** (data from valid inferences)
      * **unclassified** (data from invalid inferences)

   
   **NOTE:** Achieve the same using minio API
	```
	#https://thenewstack.io/how-to-create-an-object-storage-bucket-with-minio-object-storage/

	# Apply the following command in a separate terminal
	oc port-forward $(oc get pod -l app=minio -o jsonpath="{.items[0].metadata.name}" -n edge1)  9001:9000
	mc alias set prodminio http://127.0.0.1:9001 minio minio123
	mc ls prodminio

	mc mb prodminio/production
	mc mb prodminio/data
	mc mb prodminio/valid
	mc mb prodminio/unclassified

	mc ls prodminio

	[2024-02-05 13:52:56 GMT]     0B data/
	[2024-02-05 13:52:55 GMT]     0B production/
	[2024-02-05 13:52:56 GMT]     0B unclassified/
	[2024-02-05 13:52:56 GMT]     0B valid/

	```  

1. Create a local service to access the `central` S3 storage with *Service Interconnect*.

   Follow the instructions below:

   1. Install *Service Interconnect*'s  CLI \
      (you can use an embedded terminal from the OCP's console)
      ```
      curl https://skupper.io/install.sh | sh
      ```
      ```
      export PATH="/home/user/.local/bin:$PATH"
      ```
   1. Initialize *SI* in `central` and create a connection token:
      ```
      oc project central
      ```
      ```
      skupper init --enable-console --enable-flow-collector --console-auth unsecured
      ```
      ```
      skupper token create edge_to_central.token
      ```


    1. Initialize *SI* in `edge1` and create the connection using the token we created earlier:
        ```
        oc project edge1
        ```
        ```
        skupper init
        ```
        ```
        skupper link create edge_to_central.token --name edge-to-central
        ```

    1. Expose the S3 storage service (*Minio*) from `central` on *SI*'s network using annotations:
        ```
        oc project central
        ```
        ```
        kubectl annotate service minio-service skupper.io/proxy=http skupper.io/address=minio-central
        ```
    1. Test the SI service. \
       You can test the service from `edge1` with a Route:
       ```
       oc project edge1
       oc create route edge --service=minio-central --port=port9090
       ```
       Try opening (central) Minio's console using the newly created route `minio-central`. Make sure the buckets you see are the ones from `central`. \
       You can delete the route after validating the service is healthy.
     
<br/>

### Deliver the AI/ML model and run the ML server

1. Deploy the *Edge Manager*. \
   Deploy in the new `edge1` namespace. \
   Follow instructions under:
    * **camel/edge-manager/Readme.txt** 
    
    The *Edge Manager* moves available models from the `edge1-ready` (central) to `production` (edge1). \
    When the pod starts, you will see the model available in `production`.

1. Deploy the TensorFlow server.

   Under the `edge1` project, deploy the following YAML resource:
      * **deployment/edge/tensorflow.yaml** 

   The server will pick up the newly trained model from the `production` S3 bucket.


1. Run an inference request.

   To test the Model server works, follow the instructions below.
   1. From a terminal window change directory to client folder:
      ```bash
      cd client
      ```
   1. Edit the `infer.sh` script and configure the `server` url with your TensorFlow server's route.

   1. Run the script:
      ```
      ./infer.sh
      ```
      The output should show something similar to:
      ```
      "predictions": ["tea-green", "0.838234"]
      ```

<br/>

### Create a trigger for the Pipeline

1. Create a Pipeline trigger.

   The next stage makes the pipeline triggerable. The goal is enable the platform to train new models automatically when new training data becomes available. 
   
   Follow the steps below to create the trigger.

   To provision the YAML resources below, make sure you switch to the `tf` project where your pipeline was created.

   1. Deploy the following YAML resource:
      * **deployment/pipeline/trigger-template.yaml**

   1. Deploy the following YAML resource:
      * **deployment/pipeline/trigger-binding.yaml**

   1. Deploy the following YAML resource:
      * **deployment/pipeline/event-listener.yaml**

2. Trigger the pipeline

   To manually test the pipeline trigger, from OpenShifts's UI console, open a terminal by clicking the icon `>_` in the upper-right corner of the screen.

   Copy/Paste and execute the following `curl` command:

    ```bash
    curl -v \
    -H 'content-Type: application/json' \
    -d '{"id-edge":"edge1"}' \
    http://el-train-model-listener.tf.svc:8080
    ```
   The output of the command above should show the status response:
    ```
    HTTP/1.1 202 Accepted
    ```
   Switch to the Pipelines view to inspect if a new pipeline execution has started.

   a. When the pipeline succeeds, a new model version will show up in the `edge1-models` S3 bucket.
   
   b. The pipeline also pushes the new model to the `edge1-ready` bucket. The *Edge Manager* moves the model to the *Edge Minio* instance, into the `production` bucket.  The Model server will detect the new version and hot reload it.

1. Deploy a Kafka cluster

   The platform uses Kafka to produce/consume events to trigger the pipeline automatically.

   1. Install the *AMQ Streams* operator in the `central` namespace.
   1. Deploy a Kafka cluster in the `central` namespace using the following YAML resource:
      * **deployment/central/kafka.yaml**
      
      Wait for the cluster to fully deploy.

1. Deploy the Camel delivery system

    This Camel system is responsible to listen for Kafka signals to trigger pipeline executions.

    Follow instructions under:
    * **camel/central-delivery/Readme.txt**

    When successfully deployed, *Camel* should connect to *Kafka* and create a *Kafka* topic `trigger`. Check in your environment *Camel* started correctly, and the *Kafka* topic exists.

    > [!CAUTION] 
    > You might need to wait a bit until the `trigger` topic gets created, be patient.



<br/>


### Deploy the data ingestion system

A *Camel* service deployed on *Central* will be ready listening for requests to ingest training data.

Upon receiving data ingestion requests, Camel will:
* Unpack the data and push it to central S3 storage.
* Send a signal via *Kafka* to kick off the process of training a new AI/ML model.

<br/>

1. Deploy the *Feeder*

    To deploy the system on *OpenShift*, follow instructions under:
    * **camel/central-feeder/Readme.txt**

    Check in your environment *Camel* has started and is in healthy state.

1. Expose the *Feeder* service to the *Service Interconnect* network to allow `edge1` to have visibility:
    ```
    oc project central
    ```
    ```
    kubectl annotate service feeder skupper.io/proxy=http
    ```


1. (for testing purposes) Expose the `feeder` service (in `edge1`) by executing the command below:

   ```bash
   oc expose service feeder -n edge1
   ```

<br/>

### Test the end to end solution

This final test validates all the platform stages are healthy. We should see the following processes in motion:

1. A client sends training data for a new product.
1. The feeder system (Camel) ingests the data, stores it in S3, and sends a trigger signal.
1. The delivery system (Camel) receives the signal and triggers the Pipeline.
1. The Pipeline trains a new model and pushes it to S3 storage.
1. The edge manager (Camel) detects a new model and moves it to local S3 storage.
1. The edge ML Server (TensorFlow) detects a new model and hot deploys it.
1. The platform has now evolved and capable of detecting the new product.

<br/>

Procedure:

1. Check the current edge model version in `production`.
   
   The `edge1` Minio S3 bucket should show model version `2` under:
   * **production/models/tea_model_b64**

1. Push training data

   From the `central-feeder` project, execute in your terminal the following `curl` command:
    > [!CAUTION] 
    > If the ZIP file is big, be patient.
   ```
   ROUTE=$(oc get routes -n edge1 -o jsonpath={.items[?(@.metadata.name==\'feeder\')].spec.host}) && \
   curl -v -T data.zip http://$ROUTE/zip?edgeId=edge1
   ```
1. When the upload completes you should see a new pipeline execution has started.

1. When the pipeline execution completes you should see a new version `3` deployed under:
   * **production/models/tea_model_b64**

1. Test the new model

   Send a new inference request against the ML Server. \
   Under the project's `client` folder, execute the script:
   ```
   ./infer.sh
   ```


<br/>

### Deploy the AI-powered (intelligent) App

The App connects edge devices to the platform and integrates with the various systems. \
It includes an interface capable of:
* Get price tags for products (inferencing)
* Send training data (data ingesting)
* Monitoring platform activity  


#### Install dependencies

Some components are Camel K based.

* Install Camel K Operator (cluster-wide)
  * Red Hat Integration - Camel K \
    1.10.5 provided by Red Hat

#### Install systems

Under the `edge1` namespace, perform the following actions:

1. Deploy the Price Engine (Catalogue).
   
   The price engine is based on Camel K. \
   From the folder:
    * **camel/edge-shopper/camel-price**

   First, create a *ConfigMap* containing the catalogue: \
   (make sure you're working on the `edge1` namespace) 
   ```
   oc create cm catalogue --from-file=catalogue.json -n edge1
   ```

   Then, run the `kamel` cli command:
    ```
    kamel run price-engine.xml \
    --resource configmap:catalogue@/deployments/config
    ```

1. Deploy the *Edge Monitor*. \
   Deploy it in the new `edge1` namespace. \
   Follow instructions under:
    * **camel/edge-monitor/Readme.txt** 
    
    The *Edge Monitor* bridges monitoring events from Kafka to MQTT.


1. Deploy the *Edge Shopper* (Intelligent App). \
   Deploy it in the new `edge1` namespace. \
   Follow instructions under:
    * **camel/edge-shopper/Readme.txt** 
    
    The *Edge Shopper* allows for inferencing/data-acquisition/monitoring from a web-based app the user can operate.

1. Create a route to enable external connectivity:
    ```
    oc create route edge camel-edge --service shopper
    ```
   Use the route URL to connect from a browser.
