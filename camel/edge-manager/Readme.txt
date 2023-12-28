Introduction
============

This project contains a manager service to fetch new AI models and bring them to the edge for local inferencing.


Prerequisites
=============

Camel needs to move AI models between S3 buckets.

Deploy a Minio instance, for example:
 1) create a new namespace
 2) use
    > oc apply -f ../../deployment/minio.yaml
 3) Open Minio's UI
 4) Login with minio/minio123
 5) create necessary buckets (e.g. 'edge1-models' and 'edge1-ready')


Deploy in Openshift
===================

./mvnw clean package -DskipTests -Dquarkus.kubernetes.deploy=true

