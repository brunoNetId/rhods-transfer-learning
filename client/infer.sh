# set -x

image=./lemon.jpg

curl -X POST \
-v \
-H "content-type: application/json" \
"https://tf-server-ai-demo.apps.cluster-rhhz8.dynamic.redhatworkshops.io/v1/models/tea_model_b64:predict" \
-d '
{
   "instances":
   [
	{
	   "b64": "'$(base64 -i $image)'"
	}
   ]
}'