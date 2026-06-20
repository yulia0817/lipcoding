param location string
param appServicePlanId string

resource backendApp 'Microsoft.Web/sites@2023-01-01' = {
  name: 'lipcoding-backend'
  location: location
  properties: {
    serverFarmId: appServicePlanId
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'PYTHON|3.11'
    }
  }
}

output backendUrl string = 'https://${backendApp.properties.defaultHostName}'
