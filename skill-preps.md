
for configuration of iam sso/oidc or data-gateway in both case agent needs to follow the bellow steps 

initial steps to get into a project/tenant for configuration of blocks services like data, iam etc
# initial steps #
### step-1 ###
get access token  using the bellow curl
```
curl --location 'https://api.seliseblocks.com/iam/v4/auth-login' \ --header 'Content-Type: application/json' \ --data-raw '{ 	"username": "klr.lakit@yopmail.com", 	"password": "1qazXSW@" }'
```
form access token claims u can have tenant id and it's the root-tenant-id
 
### step-2 ### 
then get available projects using below curl using the access_token of step-1
 
```
curl --location 'https://api.seliseblocks.com/os/v4/Project/Gets?page=0&pageSize=100' \ --header 'x-blocks-key: <root-tenant-id>' \ --header 'Authorization: bearer <your-access-token>'
```

from step-2 agent should ask which project/tenant to pick or if user already provide the tenantid or projectid then check is there available project/tenant in the response of step 2
 
 
### step-3 ### 
now impersonate to the project or tenant for configuration
heck the impersonation status by below request
 
```
curl --location --request POST 'https://api.seliseblocks.com/iam/v4/auth/impersonation/status' \ --header 'x-blocks-key: <root-tenant-id>' \ --header 'Authorization: bearer <your-access-token>'
```

if in response 'impersonated' value is for false then request for impersonated token using https://api.seliseblocks.com/iam/v4/auth/impersonate if value is true then do not need to proceed for impersonated token
after getting this token now u are ready to configure iam sso/oidc or data-gateway
 
 
now how can u configure any blocks service

# blocks-iam configuration skills #
here is swagger json https://api.seliseblocks.com/iam/v4/swagger/v1/swagger.json
dont bring all the endpoint in the skill
1st create skill for blocks iam sso/oidc configuration and blocks iam sso/oidc implementation 

### step-1 ### 
get identity provider list
 
```
curl --location 'https://api.seliseblocks.com/iam/v4/auth/identity-providers' \ --header 'x-blocks-key: <root-tenant-id>' \ --header 'Authorization: bearer <your-impersonated-access-token>'
```

if in the response there are no data or there is data but doesn't match the condition {"providerType": "blocks-oidc"}
then step-2 other then that u can use this and no need to proceed furthur
 
 
### step-2 ### 
get OIDC Client using below curl
```
curl --location ''https://api.seliseblocks.com/iam/v4//oidc-clients' \
--header 'x-blocks-key: <root-tenant-id>' \ --header 'Authorization: bearer <your-impersonated-access-token>'
```

if there is data then using clientId,clientSecret and redirectUris create identity provider by following step-4 other then that create OIDC client first following step-3
 
 
### step-3 ### 
OIDC Client using below curl
 
```
curl --location 'https://api.seliseblocks.com/iam/v4/oidc-clients' \
--header 'x-blocks-key: <root-tenant-id>' \ --header 'Authorization: bearer <your-impersonated-access-token>'
--header 'Content-Type: application/json' \
--data '{
	"audience": "",
	"redirectUris": [
    	"https://your.application-domain.com/callback"
	],
	"scope": "openid",
	"isAutoRedirect": true,
	"isActive": true,
	"requirePkce": true,
	"allowedResponseTypes": [
    	"code"
	],
	"allowedServiceAccessResources": [
    	"blocks-iam",
    	"blocks-monitor",
    	"blocks-data",
    	"blocks-utilities",
    	"blocks-agent",
    	"blocks-os",
    	"blocks-localization",
    	"blocks-release"
	],
	"itemId": "",
	"projectKey": <your-tenant-id>,//not root tenant id
	"clientBrandColor": "#124091",
	"clientDisplayName": "your-client-name-any-string-value"
}'
```

after successfully create OIDC Client now create Identity provider in step-4
 
### step-4 ### 
create Identity provider 1st do the step-2 and get data u will get clientId,clientSecret and redirectUris from response 
if u already have the request for create identity provider
 
``` 
curl --location 'https://api.seliseblocks.com/iam/v4/auth/identity-providers' \
--header 'x-blocks-key: <root-tenant-id>' \ --header 'Authorization: bearer <your-impersonated-access-token>'
--header 'Content-Type: application/json' \
--data '{"displayName":"","providerType":"blocks-oidc","provider":"any-string-value","clientId":"7ac65a7d-f1b6-4e55-adb3-bcbd80210947","clientSecret":"d22a7b73827c4b72ba6f57d642bc6352","audience":"","wellKnownUrl":"https://iam.seliseblocks.com/Td653f443d18c4260b793fa2faf890fec/.well-known/openid-configuration","tokenEndpointAuthMethod":"client_secret_basic","scope":"openid","redirectUris":["https://your.application-domain.com/callback"],"isActive":true,"requirePkce":false,"initialRoles":["user"],"initialPermissions":[]}'
```

# blocks-iam implementation skills #
Now u are goog to go blocks iam sso/oidc  implementation in frontend code base
In front end code dont implement log in directly implement the blocks iam sso/oidc which is authorization code flow
add a button for login in any where in the application
When user click on login/sign request to the initiate api(do not redirect) 
```
GET https://api.seliseblocks.com/iam/v4/idp/initiate ?x-blocks-key=<X_BLOCKS_KEY> &clientId=<OIDC clientId> &redirectUri=<redirect_url>
```

“Redirect_uri” is in response and redirect to this in browser, after all log in in https://iam.seliseblocks.com
Then redirect to redirect url we configured
After redirected to client application and from front end request to /idp/callback?code=…&state=…
and it will set cookie




 
 
 

