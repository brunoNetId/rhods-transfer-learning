# rhods-transfer-learning

This project contains resources to showcase a full circle continuous motion of data to capture training data, train new ML models, deploy them, serve them, and expose the service for clients to send inference requests.

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

1. Create a new *Data Science Project*. \
From RHODS create a new project, for example `tf` (TensorFlow)

1. Create a new *Data Connection*. \
Under the new `tf` project > Data connections, click `Add data connection`. \
Enter the following paramters:
   * Name: `dc1` (data connection 1)
   * Access key: `minio` 
   * Secret key: `minio123` 
   * Endpoint: _YOUR MINIO API ROUTE_ 
   * Region: `eu-west-2`
   * Bucket: `workbench`

1. Create a *Pipeline Server*. \
Under the new `tf` project > Pipelines, click `Create a pipeline server`. \
Enter the following paramters:
   * Existing data connection: `dc1` \

   Then click `Configure` to proceed.

1. Create a '*PersistentVolumeClaim*' for the pipeline. \
The PVC will enable shared storage for the pipeline's execution. \
Deploy the following YAML resource:
      * **deployment/pipeline/pvc.yaml**

1. Create a new *Workbench*. \
Under the new `tf` project > Workbenches, click `Create workbench`. \
Enter the following paramters:
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

1. Open the workbench (*Jupyter*). \
When your workbench is in *Running* status, click `Open`. \
Enter for example the creadentials `user1/openshift`.

1. Upload the pipeline sources to the project tree. \
   > [!WARNING]
   > Do not use the *'Git Clone'* feature to upload the project, you don't need to upload the big dataset of images!

   Under the *Jupyter* menu, click the icon *'Upload Files'* and select all the files under the repository path:
      * **workbench/pipeline/**

1. Export the pipeline in a *Tekton* YAML file.
   
   > :Tip: Reference to documented guidelines:
   > * https://docs.google.com/document/d/1kcubQQuQyJGP_grbMD6Jji8o-IBDrYBbuIOREj2dFlc/edit#heading=h.wd1fnfz39nr

   1. Double click on the `retrain.pipeline` resource. The pipeline will be displayed in *Elyra* (embedded visual pipeline editor in Jupyter).
   1. Hover and click on the icon with label `Export Pipeline`.
   1. Enter the following paramters:
      * s3endpoint: *YOUR MINIO API ROUTE*
      * leave all other parameters with default values.
   1. Click `OK`.

   a. The action will produce a new file `retrain.yaml` file.

   b. It will also populate your S3 bucket `workbench` with your pipeline's artifacts.

1. Import the pipeline as an *OpenShift Tekton* pipeline. \
From your OpenShift UI Console, navigate to Pipelines > Pipelines. \

   > :Tip: Reference to documented guidelines:
   > * https://docs.google.com/document/d/1kcubQQuQyJGP_grbMD6Jji8o-IBDrYBbuIOREj2dFlc/edit#heading=h.pehkoctq6uk2

Click `Create > Pipeline`.
