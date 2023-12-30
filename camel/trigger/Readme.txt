Introduction
============

This folder contains a simple tester to manually trigger the AI pipeline.


Prerequisites
=============

The tester pushes a trigger event to a Kafka topic.
The 'delivery' system needs to be deployed in OpenShift, it consumes the event and triggers the pipeline.

Make sure you configure the Kafka connectivity parameters pointing to your environment.
 > application.properties

Run it 
======

Use Camel JBang to run it.

Run it with:

 > camel run *