# set -x

# image=./lemon.jpg
# image=./earl-grey.jpg
# image=./earl-grey2.jpeg
# image=./earl-grey4.jpeg
# image=./kid.jpg
image=./apple.jpg
server=https://tf-server-ai-demo.apps.cluster-2lngl.sandbox1314.opentlc.com

curl -X POST \
-v \
-H "content-type: application/json" \
$server"/v1/models/tea_model_b64:predict" \
-d '
{
   "instances":
   [
	{
	   "b64": "'$(base64 -i $image)'"
	}
   ]
}'