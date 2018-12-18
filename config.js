const environments = {};

environments.staging = {
    'httpPort': 8000,
    'httpsPort': 8001,
    'name': 'staging',
    'hashingSecret': 'stageSecret',
    'maxChecks': 5,
    'twilio' : {
        'accountSid' : 'ACc9409f6b65e86296871e73be4ef21e23',
        'authToken' : 'ad4ae3718d42d11c11d452924080024b',
        'fromPhone' : '+79101898994'
      }
};

environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'name': 'production',
    'hashingSecret': 'prodSecret',
    'maxChecks': 5,
    'twilio': {
        'accountSid': '',
        'authToken': '',
        'fromPhone': ''
    }
}

const currentEnvironment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : 'staging ';

const environmentToExport =  typeof(environments[currentEnvironment]) === "object" ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;