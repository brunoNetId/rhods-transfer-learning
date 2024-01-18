Introduction
============

This project contains services to push training data to an AI platform.


Prerequisites
=============

Camel needs to push training data (images) to an S3 bucket.

Ensure a Minio instance is deployed on 'central'.
If one doesn't exist, you can create it following the steps below:
 1) create a new namespace (e.g. central)
 2) use
    > oc apply -f ../../deployment/central/minio.yaml
 3) Open Minio's UI
 4) Login with minio/minio123
 5) create a bucket 'edge1-data'.

Prepare the training data (ZIP file)

 Tip: to get new collections you can browse images in Google and click "Save as..."
 Then find all files named 'images(n)' and rename them to jpg using:
  > find . -type f -exec mv "{}" "{}.jpg" \;

 You need to compress the data from the "dataset" folder and preserve the correct paths.

 1) Execute:
    > (cd ../../dataset && zip -r "$OLDPWD/data.zip" images)


Run a local instance
====================

Make sure you configure your S3 URL.
 1) Update your 'application.properties'
 2) replace YOUR_MINIO_ROUTE by your Minio route in your OCP environment

To run it locally with the command below:

	./mvnw clean compile quarkus:dev


Deploy in Openshift
===================

oc project central

./mvnw clean package -DskipTests -Dquarkus.kubernetes.deploy=true

Note:
 > This service (feeder) is not exposed publicly.
 > Service Interconnect will make it consumable from Edge regions.


Test the service
================

If you want to test the service from your local machine, you'll need to create a Route:

oc expose service feeder

You should have already the following resources ready:
 
 - Minio deployed with a 'edge1-data' bucket
 - Camel service 'feeder' deployed and a route available.
 - ZIP file (training data) 'data.zip'.

To push the training data, execute with curl the following command:

(local)
curl -v -T data.zip http://localhost:8080/zip?edgeId=edge1

(openshift)
ROUTE=$(oc get routes -o jsonpath={.items[?(@.metadata.name==\'feeder\')].spec.host}) && \
curl -v -T data.zip http://$ROUTE/zip?edgeId=edge1