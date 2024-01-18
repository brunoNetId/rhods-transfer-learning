Introduction
============

This project contains a manager service to fetch newly trained AI models and bring them to the edge for local inferencing.


Prerequisites
=============

Camel needs to move AI models between S3 buckets.

A central Minio instance needs to exist (where the pipeline drops new models).
Also, the central minio needs to be accessible, either by:
 - a Service Interconnect local service
 - a Route

Ensure a Minio instance is deployed on the Edge.
You can create one following the steps below:
 1) create a new namespace (e.g. edge1)
 2) use
    > oc apply -f ../../deployment/edge/minio.yaml
 3) Open Minio's UI
 4) Login with minio/minio123
 5) create a bucket 'production'.


Deploy in Openshift
===================

oc project edge1

./mvnw clean package -DskipTests -Dquarkus.kubernetes.deploy=true

