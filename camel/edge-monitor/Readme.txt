Introduction
============

This project contains a service to bridge monitoring traffic from Kafka to MQTT.


Prerequisites
=============

Camel needs move events from Kafka to MQTT (AMQ).

Ensure an AMQ Broker (Artemis) and an AMQ Streams cluster are available in your environment.


Run a local instance
====================

(Not tested to run locally)


Deploy in Openshift
===================

oc project edge1

./mvnw clean package -DskipTests -Dquarkus.kubernetes.deploy=true
