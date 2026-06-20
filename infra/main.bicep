param location string = resourceGroup().location
param environment string = 'dev'

var appName = 'lipcoding-${environment}'
var frontendName = '${appName}-frontend'
var backendName = '${appName}-backend'

resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: '${appName}-plan'
  location: location
  sku: {
    name: 'F1'
    capacity: 1
  }
  kind: 'linux'
}

resource frontendApp 'Microsoft.Web/sites@2023-01-01' = {
  name: frontendName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
  }
}

resource backendApp 'Microsoft.Web/sites@2023-01-01' = {
  name: backendName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
  }
}

output frontendUrl string = 'https://${frontendApp.properties.defaultHostName}'
output backendUrl string = 'https://${backendApp.properties.defaultHostName}'
