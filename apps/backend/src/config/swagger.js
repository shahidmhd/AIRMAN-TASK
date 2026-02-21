const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AIRMAN API',
      version: '1.0.0',
      description: 'Aviation Learning & Scheduling Platform API',
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        // ─── Auth ───────────────────────────────────────────
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email:    { type: 'string', format: 'email', example: 'student@airman.com' },
            password: { type: 'string', minLength: 8,    example: 'Password123!' },
            name:     { type: 'string', minLength: 2,    example: 'Jane Student' },
            role:     { type: 'string', enum: ['STUDENT', 'INSTRUCTOR'], example: 'STUDENT' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email', example: 'admin@airman.com' },
            password: { type: 'string', example: 'Password123!' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            accessToken:  { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        // ─── User ───────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            id:         { type: 'string', format: 'uuid' },
            email:      { type: 'string', format: 'email' },
            name:       { type: 'string' },
            role:       { type: 'string', enum: ['STUDENT', 'INSTRUCTOR', 'ADMIN'] },
            isApproved: { type: 'boolean' },
            createdAt:  { type: 'string', format: 'date-time' },
          },
        },
        // ─── Pagination ─────────────────────────────────────
        Pagination: {
          type: 'object',
          properties: {
            total:      { type: 'integer' },
            page:       { type: 'integer' },
            limit:      { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        // ─── Error ──────────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            error:   { type: 'string' },
            message: { type: 'string' },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Validation Error' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field:   { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth',  description: 'Authentication & token management' },
      { name: 'Users', description: 'User management (Admin only)' },
    ],
  },
  apis: ['./src/modules/**/*.routes.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;