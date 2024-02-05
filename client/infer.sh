# set -x

#server=https://tf-server-edge1.apps.cluster-252hm.sandbox1471.opentlc.com

#server=https://$(oc get route tf-server -o jsonpath='{.spec.host}')

echo
echo $server
echo
sleep 2s

# image=./lemon.jpg
image=./green.jpg
# image=./earl-grey3.jpg
# image=./earl-grey.jpg
# image=./earl-grey2.jpeg
# image=./earl-grey4.jpeg
# image=./kid.jpg
# image=./apple.jpg

echo "---------------------------------"
echo "curl -X POST -v -H \"content-type: application/json\" ${server}\"/v1/models/tea_model_b64:predict\" -d ' { \"instances\": [ {\"b64\": \"'$(base64 -i $image)'\"} ]}'"
echo "---------------------------------"
echo
echo
echo

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
