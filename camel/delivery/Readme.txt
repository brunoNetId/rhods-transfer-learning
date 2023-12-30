Introduction
============

This project contains services to control the delivery of AI models.


Prerequisites
=============

Camel consumes Kafka events to trigger the pipeline requested for a given Edge environment.

Ensure a Kafka instance exists in the 'central' namespace.

Ensure Pipeline triggers are defined in the platform.


Deploy in Openshift
===================

Ensure your OpenShift client points to the 'central' namespace:

oc project central

Execute the command below to deploy the system:

./mvnw clean package -DskipTests -Dquarkus.kubernetes.deploy=true

