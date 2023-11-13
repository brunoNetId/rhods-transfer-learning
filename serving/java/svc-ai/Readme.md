
## Running the stub service

Run it executing the command below:

```
mvn -Dspring-boot.run.profiles=dev -s configuration/settings.xml
```

You can discover the *OpenApi* service specification with the following `curl` command:

```
curl http://localhost:9000/camel/openapi.json
```

You can send a `POST` request with the following `curl` command:

>**Note**: it's a dummy stub and the payload to send can be empty

```
curl \
-H "content-type: application/xml" \
-d '' \
http://localhost:9000/camel/subscriber/details
```

## Deploying on Openshift

Ensure you create/switch-to the namespace where you want to deploy the stub.

> **Note:** instructions are based on Camel for Spring Boot 3.14.x GA version.

Run the following command to trigger the deployment:
```
mvn oc:deploy -Popenshift -s configuration/settings.xml
```

To test the stub once deployed, open a tunnel with the following command:
```
oc port-forward service/end1 8080
```
>**Note**: the stub will run on port 8080 when deployed in OCP

You can discover the *OpenApi* service specification with the following `curl` command:

```
curl http://localhost:8080/camel/openapi.json
```

You can send a `POST` request with the following `curl` command:

>**Note**: it's a dummy stub and the payload to send can be empty

```
curl \
-H "content-type: application/xml" \
-d '' \
http://localhost:8080/camel/subscriber/details
```
