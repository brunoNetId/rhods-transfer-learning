# Introduction

This project is only a POC to showcase how to load a TensorFlow model in Java and run an inference against it.

## Running the stub service

Run it executing the command below:

```
mvn -Dspring-boot.run.profiles=dev -s configuration/settings.xml
```

You should see in the terminal's output something similar to:

```
2023-12-22 12:25:48.406389: I tensorflow/cc/saved_model/loader.cc:311] SavedModel load for tags { serve }; Status: success. Took 867939 microseconds.
model loaded: org.tensorflow.SavedModelBundle@26888c31
TEA: tea-lemon
Probability: 0.901380
```