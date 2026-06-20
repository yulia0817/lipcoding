param location string
param appServicePlanId string

resource frontendApp 'Microsoft.Web/sites@2023-01-01' = {
  name: 'lipcoding-frontend'
  location: location
  properties: {
    serverFarmId: appServicePlanId
    httpsOnly: true
  }
}

output frontendUrl string = 'https://${frontendApp.properties.defaultHostName}'
