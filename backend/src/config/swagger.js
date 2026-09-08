const swaggerJsDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CRUD Inventory Management System API',
      version: '1.0.0',
      description:
        'RESTful API documentation for RED Software Full Stack Developer Assignment. Covers Authentication, Products, Categories, Stock Management, and Analytics.',
      contact: {
        name: 'Full Stack Engineering Team',
        email: 'support@inventory.local'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/app.js']
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = swaggerSpec;
