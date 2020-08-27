#!/bin/bash

curl --request POST  --url 'https://prod-162.westeurope.logic.azure.com:443/workflows/6b2242c4450549f691b25464aa90b4bf/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=WbiOL1L6tav9sv0WHnPSBuQQmpfe1QFS6QVXt-LDmIc'  --header 'content-type: application/json' --data '{
	"filepath": "fixtures/fixtures_v2"
}'