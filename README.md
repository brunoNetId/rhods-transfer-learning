# rhods-transfer-learning

This project contains resources to showcase a full circle continuous motion of data to capture training data, train new ML models, deploy them, serve them, and expose the service for clients to send inference requests.

   > [!CAUTION] 
   > This project is still under construction. The instructions below are temporary and will change as the project evolves.

## Deployment instructions

The following list summarises the steps to deploy the demo:

1. Provision the following RHDP item:
   * Base RHODS on AWS: \
https://demo.redhat.com/catalog?item=babylon-catalog-prod/sandboxes-gpte.ocp4-workshop-rhods-base-aws.prod&utm_source=webapp&utm_medium=share-link

1. Deploy an instance of Minio
   
   1. Create a new project, for example `ai-demo`
   3. Under the `ai-demo` project, deploy the following YAML resource:
      * **deployment/minio.yaml**

1. Create necessary S3 buckets
   
   1. Open the Minio UI (_UI Route_)
   2. Login with `minio/minio123`
   3. Create buckets:
      * **data**
      * **production**
      * **workbench**

1. Create a new *Data Science Project*.

   Open *Red Hat OpenShift AI* (also known as RHODS). \
   Enter for example the credentials `user1/openshift`. \
   Select *Data Science Projects* and click `Create data science project`. \
   As a name, use for example `tf` (TensorFlow)

1. Create a new *Data Connection*.

   Under the new `tf` project > Data connections, click `Add data connection`. \
   Enter the following parameters:
   * Name: `dc1` (data connection 1)
   * Access key: `minio` 
   * Secret key: `minio123` 
   * Endpoint: `http://minio-service.ai-demo.svc:9000` 
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

   When your workbench is in *Running* status, click `Open`. \
Enter for example the credentials `user1/openshift`.

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
      * s3endpoint: `http://minio-service.ai-demo.svc:9000` 
      * leave all other parameters with default values.
   1. Click `OK`.

   a. The action will produce a new file `retrain.yaml` file.

   b. It will also populate your S3 bucket `workbench` with your pipeline's artifacts.

1. Import the pipeline as an *OpenShift Tekton* pipeline.

   From your OpenShift UI Console, navigate to Pipelines > Pipelines.

   > [!TIP] 
   > Reference to documented guidelines:
   > * https://docs.google.com/document/d/1kcubQQuQyJGP_grbMD6Jji8o-IBDrYBbuIOREj2dFlc/edit#heading=h.pehkoctq6uk2

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
   Complete the YAML code above with the `pipelineSpec` definition from your exported YAML file in Jupyter.
      > [!CAUTION] 
      > Make sure your un-tab one level the `pipelineSpec` definition to make the resource valid.

   Click `Create`.

   You can test the pipeline by clicking `Action > Start`, accept default values and click `Start`.

   You should see the pipeline fail because there is no trainable data available just yet.

1. Upload training data to S3.

   There are two options to upload training data:
   * **Manually (recommended)**: Use Minio's UI console to upload the `images` dataset under:
     * dataset/images
   * **Automatically**: Use the Camel server provided in the repository to push training data to S3. Follow the instructions under:
     * camel/server-quarkus/Readme.txt

1. Train the model.

   You can re-run the pipeline by clicking `Action > Start`, accept default values and click `Start`.

   You should now see the pipeline succeed. It will push the new model in the `production` bucket.

1. Deploy the TensorFlow server.

   Under the `ai-demo` project, deploy the following YAML resource:
      * **deployment/tensorflow.yaml** 

   The server will pick up the newly trained model from the S3 bucket.

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
      "predictions": ["tea-lemon", "0.866093"]
      ```

1. Create a Pipeline trigger.

   The pipeline will eventually become automatically triggered when new data to retrain the model becomes available. Follow the steps below to create the trigger.

   To provision the YAML resources below, make sure you switch to the `tf` project where your pipeline was created.

   1. Deploy the following YAML resource:
      * **deployment/pipeline/trigger-pipeline.yaml**

   1. Deploy the following YAML resource:
      * **deployment/pipeline/trigger-binding.yaml**

   1. Deploy the following YAML resource:
      * **deployment/pipeline/event-listener.yaml**

2. Trigger the pipeline

   To test the pipeline trigger, from OpenShifts's UI console, open a terminal by clicking the icon `>_` in the upper-right corner of the screen.

   Copy/Paste and execute the following `curl` command:

    ```bash
    curl -v \
    -H 'content-Type: application/json' \
    -d '{}' \
    http://el-train-model-listener.tf.svc:8080
    ```
   The output of the command above should show the status response:
    ```
    HTTP/1.1 202 Accepted
    ```
   Switch to the Pipelines view to inspect if a new pipeline is in execution.

   a. When the pipeline succeeds, a new model version will show up in the `production` S3 bucket.
   
   b. When a new model version is pushed, the Model server will detect the new version and hot reload it.
