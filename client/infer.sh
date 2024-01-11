# set -x

server=https://tf-server-edge1.apps.cluster-958kv.sandbox1500.opentlc.com

# image=./lemon.jpg
image=./green.jpg
# image=./earl-grey3.jpg
# image=./earl-grey.jpg
# image=./earl-grey2.jpeg
# image=./earl-grey4.jpeg
# image=./kid.jpg
# image=./apple.jpg

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