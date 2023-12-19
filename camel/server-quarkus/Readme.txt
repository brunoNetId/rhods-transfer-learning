Introduction
============

This project contains services to push training data to an AI platform.


Prerequisites
=============

Camel needs to push training data (images) to an S3 bucket.

Deploy a Minio instance, for example:
 1) create a new namespace
 2) use
    > oc apply -f ../../deployment/minio.yaml
 3) Open Minio's UI
 4) Login with minio/minio123
 5) create a bucket "data"

Prepare the training data (ZIP file)
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

./mvnw clean package -DskipTests -Dquarkus.kubernetes.deploy=true

Make sure you expose the service:

oc expose service demo


Test the service
================

You should have already the following resources ready:
 
 - Minio deployed with a 'data' bucket
 - Camel service 'demo' deployed and a route available.
 - ZIP file (training data) 'data.zip'.

To push the training data, execute with curl the following command:

(local)
curl -v -T data.zip http://localhost:8080/zip

(openshift)
curl -v -T data.zip http://ROUTE_URL/zip