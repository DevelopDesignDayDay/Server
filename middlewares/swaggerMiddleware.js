const _swaggerDefinition = {
    info: {
        version: '1.0.0',
        title: 'ddd'
    },
    securityDefinitions: {
        basicAuth: {
            type : 'basic'
        },
        JWT: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header'
        }
    }, security: [{
        JWT: []
    }]
};

const _swaggerOptions = {
    swaggerDefinition: _swaggerDefinition,
    apis: [
        './app/routes/*.js'
    ]
};

exports.initSwagger = (app) => {
    const swaggerUi = require('swagger-ui-express');
    const swaggerJSDOC = require('swagger-jsdoc');
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJSDOC(_swaggerOptions)));
};