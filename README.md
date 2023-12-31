# rhods-transfer-learning

This project contains resources to showcase a full circle continuous motion of data to capture training data, train new ML models, deploy them, serve them, and expose the service for clients to send inference requests.

   > [!CAUTION] 
   > This project is still under construction. The instructions below are temporary and will change as the project evolves.

RHODS artifacts are not YAML editable, they require UI interaction. \
Although tedious and time consuming, by the end of the deployment procedure (below), you will be able to understand how the full cycle connects all the stages together (acquisition, training, delivery, inferencing).

## Tested with

* RHODS 2.5.0 provided by Red Hat
* RHO Pipelines 1.10.4 provided by Red Hat
* AMQ-Streams 2.6.0-0 provided by Red Hat
* Red Hat build of Apache Camel 4

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
   
   1. Create a new project, for example `central`
   3. Under the `central` project, deploy the following YAML resource:
      * **deployment/central/minio.yaml**

1. Create necessary S3 buckets
   
   1. Open the Minio UI (_UI Route_)
   2. Login with `minio/minio123`
   3. Create buckets for RHODS:
      * **workbench**
   3. Create buckets for Edge-1:
      * **edge1-data**
      * **edge1-models**
      * **edge1-ready**
   3. Create buckets for Edge-2:
      * **edge2-data**
      * **edge2-models**
      * **edge2-ready**

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

   Under the *Jupyter* menu, click the icon *'Upload Files'* and select all the files under the repository path:
      * **workbench/pipeline/**

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
   
     [Copy paste here contents of 'pipelineSpec']
   ```
   Complete the YAML code above with the `pipelineSpec` (around line 50) definition from your exported YAML file in Jupyter (`retrain.yaml`).
      > [!CAUTION] 
      > Make sure you un-tab one level the `pipelineSpec` definition to make the resource valid.

   Click `Create`.

   You can test the pipeline by clicking `Action > Start`, accept default values and click `Start`.

   You should see the pipeline <u>**fail**</u> because there is no trainable data available just yet.

1. Upload training data to S3.

   There are two options to upload training data:
   * **Manually (recommended)**: Use Minio's UI console to upload the `images` folder under:
     * dataset/images \
       (wait for all images to be fully uploaded)
   * **Automatically**: Use the Camel server provided in the repository to push training data to S3. Follow the instructions under:
     * camel/edge-feeder/Readme.txt

1. Train the model.

   When **ALL** images have been uploaded, re-run the pipeline by clicking `Action > Start`, accept default values and click `Start`.

   You should now see the pipeline succeed. It will push the new model to the following buckets:
   * `edge1-models`
   * `edge1-ready`

<br/>

### Deliver the AI/ML model and run the ML server

1. Prepare the Edge-1 environment

   1. Create a new *OpenShift* project `edge1`.
   2. Deploy a *Minio* instance in the `edge1` namespace using the following YAML resource:
      * **deployment/edge/minio.yaml**
   1. In the new *Minio* instance create a bucket called `production`.
   1. Deploy the *Edge Manager*. \
      Follow instructions under:
      * **camel/edge-manager/Readme.txt** 
      
      The *Edge Manager* moves available models from the `edge1-ready` (central) to `production` (edge1).


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

<br/>

### Deploy the data ingestion system

A *Camel* service deployed on the edge will be ready listening for requests to ingest training data.

Upon receiving data ingestion requests, Camel will:
* Unpack the data and push it to central S3 storage.
* Send a signal via Kafka to kick off the process of training a new AI/ML model.

<br/>

1. Deploy the *Edge Feeder*

    To deploy the system on *OpenShift*, follow instructions under:
    * **camel/edge-feeder/Readme.txt**

    Check in your environment *Camel* has started and is in healthy state.

1. Make sure you have exposed its service by executing the command below:

   ```bash
   oc expose service feeder
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

   Under your `edge-feeder` project, execute in your terminal the following `curl` command:

   ```
   ROUTE=$(oc get routes -o jsonpath={.items[?(@.metadata.name==\'feeder\')].spec.host}) && \
   curl -v -T data.zip http://$ROUTE/zip
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