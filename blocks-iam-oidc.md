for user authentication only use blocks iam oidc,
so user need to click on signin/login button then by following authorization code flow using blocks iam in frontend
 
**oidc setup in blocks**
1st create oidc client
request endpoint: /oidc-clients [POST]
sample payload: 
 
```json
{
  "audience": "",
  "redirectUris": [
    "your-application-domain" //"https://dbahjq.seliseblocks.com"
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
    "blocks-release",
    "blocks-localization",
    "blocks-os"
  ],
  "itemId": "",
  "projectKey": "your-project-key", //"D4745adc9f2564981aae2826bfc64ba79"
  "clientBrandColor": "#124091",
  "clientDisplayName": "sample oidc"
}
```
get oidc client
request endpoint: /oidc-clients [GET]
response:
 
```json
{
    "oIDCClientCredentials": [
        {
            "clientId": "your-client-id",
            "clientSecret": "your-client-secrete",
            "redirectUris": [
                "redirect-url"
            ],
            "postLogoutRedirectUris": [],
            "allowedScopes": [
                "openid"
            ],
            "allowedServiceAccessResources": [
                "blocks-iam",
                "blocks-monitor",
                "blocks-data",
                "blocks-utilities",
                "blocks-agent",
                "blocks-release",
                "blocks-localization",
                "blocks-os"
            ],
            "allowedResponseTypes": [
                "code"
            ],
            "clientName": "sample oidc",
            "logoUri": null,
            "tokenEndpointAuthMethod": "client_secret_post",
            "requirePkce": true,
            "requireConsent": false,
            "frontChannelLogoutUri": null,
            "backChannelLogoutUri": null,
            "isAutoRedirect": true,
            "externalDiscoveryEndpoint": null,
            "isActive": true,
            "loginMode": null,
            "clientType": null,
            "uiBrandColor": "#124091",
            "useTokensCookie": true,
            "requireMfa": false,
            "allowedMfaMethods": null,
            "redirectUri": "redirect-url",
            "scope": "openid",
            "serviceAccessResource": null,
            "clientDisplayName": "sample oidc",
            "clientLogoUrl": null,
            "clientBrandColor": "#124091",
            "itemId": "item-id",
            "createdDate": "2026-07-05T12:45:38.419Z",
            "lastUpdatedDate": "2026-07-05T12:45:38.42Z",
            "createdBy": "d0f81028-9dc4-45bc-b14d-e16b38363cb3",
            "language": null,
            "lastUpdatedBy": "d0f81028-9dc4-45bc-b14d-e16b38363cb3",
            "organizationId": "default",
            "tags": []
        }
    ],
    "errors": null,
    "isSuccess": true
}
```
 
2nd create Identity Provider
request url: auth/identity-providers
request body:
 
```json
{
  "displayName": "",
  "providerType": "blocks-oidc",
  "provider": "sample-idp",
  "clientId": "oidc-client-id",
  "clientSecret": "oidc-client-secrete",
  "audience": "",
  "wellKnownUrl": "https://iam.seliseblocks.com/D4745adc9f2564981aae2826bfc64ba79/.well-known/openid-configuration",
  "tokenEndpointAuthMethod": "client_secret_basic",
  "scope": "openid",
  "redirectUris": [
    "redirect-url"
  ],
  "isActive": true,
  "requirePkce": false,
  "initialRoles": [
    "user"
  ],
  "initialPermissions": []
}
```
get identity-provider
request url: auth/identity-providers[get]
response:
 
```json
{
    "data": [
        {
            "provider": "sample-idp",
            "providerType": "blocks-oidc",
            "protocol": "oidc",
            "displayName": "",
            "isActive": true,
            "clientId": "oidc-client-id",
            "clientSecret": "oidc-client-secrete",
            "issuer": "SeliseBlocks",
            "authorizationUrl": "https://iam.seliseblocks.com/api/oidc/authorize?tenant_id=tenant-id",
            "tokenUrl": "https://iam.seliseblocks.com/api/oidc/token?tenant_id=tenant-id",
            "userInfoUrl": "https://iam.seliseblocks.com/api/auth/userinfo?tenant_id=tenant-id",
            "jwksUri": "https://iam.seliseblocks.com/tenant-id/.well-known/jwks.json",
            "wellKnownUrl": "https://iam.seliseblocks.com/tenant-id/.well-known/openid-configuration",
            "redirectUris": [
                "redirecturl"
            ],
            "scope": "openid",
            "responseType": null,
            "grantTypes": [],
            "requirePkce": false,
            "tokenEndpointAuthMethod": "client_secret_basic",
            "initialRoles": [
                "user"
            ],
            "initialPermissions": [],
            "icon": null,
            "teamId": null,
            "keyId": null,
            "privateKey": null,
            "appleAudience": null,
            "itemId": "itemid",
            "createdDate": "2026-07-05T12:59:33.762Z",
            "lastUpdatedDate": "2026-07-05T12:59:33.762Z",
            "createdBy": "d0f81028-9dc4-45bc-b14d-e16b38363cb3",
            "language": null,
            "lastUpdatedBy": "d0f81028-9dc4-45bc-b14d-e16b38363cb3",
            "organizationId": "default",
            "tags": []
        }
    ],
    "isSuccess": true
}
```
 
**implementation  in code**
1st request a initiate call
 
```
https://api.seliseblocks.com/iam/v4/idp/initiate?x-blocks-key=tenant-id&clientId=oidc-client-id&redirectUri=redirection-url
```
it will take user to blocks iam, user will provide credential, blocks iam authenticate the user overall apply authorization code flow redirect to redirect-url
request to below endpoint it will set cookie
 
```
https://api.seliseblocks.com/iam/v4/idp/callback?code=bOcQJYZKfngv8ZA3yBsgWMid64up1tcpavrjHtACznM&state=rlSwnMOPaNI0kzgOTGCy9A
```