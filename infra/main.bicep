param location string = resourceGroup().location
param environment string = 'dev'

resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-04-01-preview' = {
  name: 'lipcoding-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
    }
  }
}

resource backendApp 'Microsoft.App/containerApps@2023-04-01-preview' = {
  name: 'lipcoding-backend'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8000
      }
      registries: []
    }
    template: {
      containers: [
        {
          name: 'backend'
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 2
      }
    }
  }
}

output backendUrl string = 'https://${backendApp.properties.configuration.ingress.fqdn}'
