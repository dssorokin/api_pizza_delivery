const environments = {};

environments.staging = {
    'httpPort': 8000,
    'httpsPort': 8001,
    'name': 'staging'
};

environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'name': 'production'
}

const currentEnvironment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : 'staging ';

const environmentToExport =  typeof(environments[currentEnvironment]) === "object" ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;