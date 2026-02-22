const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi    = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'AIRMAN API',
      version:     '2.0.0',
      description: 'Multi-tenant flight school management system — auth, courses, scheduling, quizzes, audit logs, feature flags.',
    },
    servers: [
      { url: 'http://localhost:4000/api', description: 'Local Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT',
        },
      },
      parameters: {
        TenantHeader: {
          in:          'header',
          name:        'x-tenant-id',
          required:    true,
          description: 'Tenant slug (e.g. skyways-aviation)',
          schema:      { type: 'string', example: 'skyways-aviation' },
        },
      },
      schemas: {
        // ── Auth ──────────────────────────────────────────────────
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email:    { type: 'string', format: 'email',   example: 'john@skyways.com' },
            password: { type: 'string', minLength: 8,      example: 'Password123!' },
            name:     { type: 'string',                    example: 'John Smith' },
            role:     { type: 'string', enum: ['STUDENT', 'INSTRUCTOR'], default: 'STUDENT' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email', example: 'admin@skyways.com' },
            password: { type: 'string',                  example: 'Password123!' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message:      { type: 'string' },
            accessToken:  { type: 'string' },
            refreshToken: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id:         { type: 'string', format: 'uuid' },
                email:      { type: 'string' },
                name:       { type: 'string' },
                role:       { type: 'string', enum: ['STUDENT', 'INSTRUCTOR', 'ADMIN'] },
                isApproved: { type: 'boolean' },
              },
            },
          },
        },
        // ── User ──────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            id:         { type: 'string', format: 'uuid' },
            email:      { type: 'string' },
            name:       { type: 'string' },
            role:       { type: 'string', enum: ['STUDENT', 'INSTRUCTOR', 'ADMIN'] },
            isApproved: { type: 'boolean' },
            createdAt:  { type: 'string', format: 'date-time' },
          },
        },
        // ── Course ────────────────────────────────────────────────
        Course: {
          type: 'object',
          properties: {
            id:          { type: 'string', format: 'uuid' },
            title:       { type: 'string' },
            description: { type: 'string' },
            createdById: { type: 'string', format: 'uuid' },
            modules:     { type: 'array', items: { $ref: '#/components/schemas/Module' } },
          },
        },
        Module: {
          type: 'object',
          properties: {
            id:       { type: 'string', format: 'uuid' },
            title:    { type: 'string' },
            order:    { type: 'integer' },
            lessons:  { type: 'array', items: { $ref: '#/components/schemas/Lesson' } },
          },
        },
        Lesson: {
          type: 'object',
          properties: {
            id:      { type: 'string', format: 'uuid' },
            title:   { type: 'string' },
            content: { type: 'string' },
            type:    { type: 'string', enum: ['TEXT', 'VIDEO', 'QUIZ'] },
            order:   { type: 'integer' },
          },
        },
        // ── Booking ───────────────────────────────────────────────
        Booking: {
          type: 'object',
          properties: {
            id:           { type: 'string', format: 'uuid' },
            date:         { type: 'string', format: 'date', example: '2026-03-15' },
            startTime:    { type: 'string', example: '09:00' },
            endTime:      { type: 'string', example: '11:00' },
            status:       { type: 'string', enum: ['REQUESTED', 'APPROVED', 'COMPLETED', 'CANCELLED'] },
            notes:        { type: 'string' },
            studentId:    { type: 'string', format: 'uuid' },
            instructorId: { type: 'string', format: 'uuid' },
          },
        },
        // ── Pagination ────────────────────────────────────────────
        Pagination: {
          type: 'object',
          properties: {
            total:      { type: 'integer' },
            page:       { type: 'integer' },
            limit:      { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        // ── Error ─────────────────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth',       description: 'Authentication & token management' },
      { name: 'Users',      description: 'User management (Admin only)' },
      { name: 'Courses',    description: 'Course, module & lesson management' },
      { name: 'Quizzes',    description: 'Quiz creation & attempts' },
      { name: 'Scheduling', description: 'Availability, bookings & calendar' },
      { name: 'Audit',      description: 'Audit logs (Admin only)' },
      { name: 'Features',   description: 'Feature flags (Admin only)' },
    ],
    paths: {
      // ── AUTH ──────────────────────────────────────────────────────
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          parameters: [{ $ref: '#/components/parameters/TenantHeader' }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
          },
          responses: {
            201: { description: 'User registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            409: { description: 'Email already in use', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login and receive JWT tokens',
          parameters: [{ $ref: '#/components/parameters/TenantHeader' }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
          },
          responses: {
            200: { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            401: { description: 'Invalid credentials' },
            403: { description: 'Account not approved' },
          },
        },
      },
      '/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Rotate refresh token',
          parameters: [{ $ref: '#/components/parameters/TenantHeader' }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { refreshToken: { type: 'string' } } } } },
          },
          responses: {
            200: { description: 'New tokens issued' },
            401: { description: 'Invalid or expired refresh token' },
          },
        },
      },
      '/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout and invalidate refresh token',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/TenantHeader' }],
          responses: { 200: { description: 'Logged out successfully' } },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user profile',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/TenantHeader' }],
          responses: {
            200: { description: 'Current user', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            401: { description: 'Unauthorized' },
          },
        },
      },
      // ── USERS ─────────────────────────────────────────────────────
      '/users': {
        get: {
          tags: ['Users'],
          summary: 'List all users (Admin only)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/TenantHeader' },
            { in: 'query', name: 'page',  schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
            { in: 'query', name: 'role',  schema: { type: 'string', enum: ['STUDENT', 'INSTRUCTOR', 'ADMIN'] } },
          ],
          responses: {
            200: {
              description: 'Paginated user list',
              content: { 'application/json': { schema: { type: 'object', properties: {
                users:      { type: 'array', items: { $ref: '#/components/schemas/User' } },
                pagination: { $ref: '#/components/schemas/Pagination' },
              } } } },
            },
            403: { description: 'Forbidden' },
          },
        },
      },
      '/users/instructors': {
        post: {
          tags: ['Users'],
          summary: 'Create a new user (Admin only)',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/TenantHeader' }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: {
              type: 'object',
              required: ['email', 'password', 'name'],
              properties: {
                email:    { type: 'string', format: 'email' },
                password: { type: 'string', minLength: 8 },
                name:     { type: 'string' },
                role:     { type: 'string', enum: ['INSTRUCTOR', 'STUDENT', 'ADMIN'], default: 'INSTRUCTOR' },
              },
            } } },
          },
          responses: {
            201: { description: 'User created' },
            409: { description: 'Email already in use' },
          },
        },
      },
      '/users/{id}/approve': {
        patch: {
          tags: ['Users'],
          summary: 'Approve a user (Admin only)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/TenantHeader' },
            { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { 200: { description: 'User approved' }, 404: { description: 'User not found' } },
        },
      },
      '/users/{id}/role': {
        patch: {
          tags: ['Users'],
          summary: 'Update user role (Admin only)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/TenantHeader' },
            { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['role'], properties: {
              role: { type: 'string', enum: ['STUDENT', 'INSTRUCTOR', 'ADMIN'] },
            } } } },
          },
          responses: { 200: { description: 'Role updated' } },
        },
      },
      '/users/{id}': {
        delete: {
          tags: ['Users'],
          summary: 'Delete user (Admin only)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/TenantHeader' },
            { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { 200: { description: 'User deleted' }, 404: { description: 'User not found' } },
        },
      },
      // ── COURSES ───────────────────────────────────────────────────
      '/courses': {
        get: {
          tags: ['Courses'],
          summary: 'List all courses (paginated + search)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/TenantHeader' },
            { in: 'query', name: 'page',   schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit',  schema: { type: 'integer', default: 10 } },
            { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Search by course title' },
          ],
          responses: { 200: { description: 'Course list with pagination' } },
        },
        post: {
          tags: ['Courses'],
          summary: 'Create a course (Instructor/Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/TenantHeader' }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['title'], properties: {
              title:       { type: 'string', minLength: 3, example: 'Private Pilot Ground School' },
              description: { type: 'string', example: 'Complete PPL ground school curriculum' },
            } } } },
          },
          responses: { 201: { description: 'Course created' } },
        },
      },
      '/courses/{id}': {
        get: {
          tags: ['Courses'],
          summary: 'Get course by ID (with modules and lessons)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/TenantHeader' },
            { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { 200: { description: 'Course detail', content: { 'application/json': { schema: { $ref: '#/components/schemas/Course' } } } } },
        },
        put: {
          tags: ['Courses'],
          summary: 'Update course (Instructor/Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/TenantHeader' },
            { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' } } } } } },
          responses: { 200: { description: 'Course updated' } },
        },
        delete: {
          tags: ['Courses'],
          summary: 'Delete course (Instructor/Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/TenantHeader' },
            { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { 200: { description: 'Course deleted' } },
        },
      },
      '/courses/{courseId}/modules': {
        post: {
          tags: ['Courses'],
          summary: 'Add module to course',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/TenantHeader' },
            { in: 'path', name: 'courseId', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['title'], properties: { title: { type: 'string' }, order: { type: 'integer' } } } } } },
          responses: { 201: { description: 'Module created' } },
        },
      },
      '/courses/modules/{moduleId}/lessons': {
        post: {
          tags: ['Courses'],
          summary: 'Add lesson to module',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/TenantHeader' },
            { in: 'path', name: 'moduleId', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['title', 'type'], properties: {
            title:   { type: 'string' },
            content: { type: 'string' },
            type:    { type: 'string', enum: ['TEXT', 'VIDEO', 'QUIZ'] },
            order:   { type: 'integer' },
          } } } } },
          responses: { 201: { description: 'Lesson created' } },
        },
      },
      // ── QUIZZES ───────────────────────────────────────────────────
      '/quizzes/lessons/{lessonId}/quiz': {
        post: {
          tags: ['Quizzes'],
          summary: 'Create quiz for a lesson (Instructor)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/TenantHeader' },
            { in: 'path', name: 'lessonId', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['questions'], properties: {
            questions: { type: 'array', items: { type: 'object', properties: {
              text:          { type: 'string', example: 'What does VFR stand for?' },
              options:       { type: 'array', items: { type: 'string' }, example: ['Visual Flight Rules', 'Very Fast Route', 'Vertical Flight Radar'] },
              correctAnswer: { type: 'string', example: 'Visual Flight Rules' },
            } } },
          } } } } },
          responses: { 201: { description: 'Quiz created' } },
        },
      },
      '/quizzes/{id}': {
        get: {
          tags: ['Quizzes'],
          summary: 'Get quiz (correct answers hidden for students)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/TenantHeader' },
            { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { 200: { description: 'Quiz with questions' } },
        },
      },
      '/quizzes/{id}/attempt': {
        post: {
          tags: ['Quizzes'],
          summary: 'Submit quiz attempt (Student)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/TenantHeader' },
            { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['answers'], properties: {
            answers: { type: 'object', additionalProperties: { type: 'string' }, example: { 'question-uuid': 'Visual Flight Rules' } },
          } } } } },
          responses: { 201: { description: 'Attempt submitted with score', content: { 'application/json': { schema: { type: 'object', properties: {
            score:      { type: 'integer', example: 80 },
            correct:    { type: 'integer', example: 4 },
            total:      { type: 'integer', example: 5 },
            passed:     { type: 'boolean' },
            results:    { type: 'array' },
          } } } } } },
        },
      },
      // ── SCHEDULING ────────────────────────────────────────────────
      '/scheduling/availability': {
        get: {
          tags: ['Scheduling'],
          summary: 'List instructor availability',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/TenantHeader' },
            { in: 'query', name: 'instructorId', schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { 200: { description: 'Availability slots' } },
        },
        post: {
          tags: ['Scheduling'],
          summary: 'Set availability slot (Instructor)',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/TenantHeader' }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['date', 'startTime', 'endTime'], properties: {
            date:      { type: 'string', format: 'date',  example: '2026-03-15' },
            startTime: { type: 'string',                  example: '09:00' },
            endTime:   { type: 'string',                  example: '17:00' },
          } } } } },
          responses: { 201: { description: 'Availability created' } },
        },
      },
      '/scheduling/bookings': {
        get: {
          tags: ['Scheduling'],
          summary: 'List bookings (role-filtered)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/TenantHeader' },
            { in: 'query', name: 'status', schema: { type: 'string', enum: ['REQUESTED', 'APPROVED', 'COMPLETED', 'CANCELLED'] } },
            { in: 'query', name: 'page',   schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit',  schema: { type: 'integer', default: 10 } },
          ],
          responses: { 200: { description: 'Booking list' } },
        },
        post: {
          tags: ['Scheduling'],
          summary: 'Request a booking (Student)',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/TenantHeader' }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['instructorId', 'date', 'startTime', 'endTime'], properties: {
            instructorId: { type: 'string', format: 'uuid' },
            date:         { type: 'string', format: 'date',  example: '2026-03-15' },
            startTime:    { type: 'string',                  example: '09:00' },
            endTime:      { type: 'string',                  example: '11:00' },
            notes:        { type: 'string',                  example: 'First solo prep lesson' },
          } } } } },
          responses: {
            201: { description: 'Booking created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } } },
            409: { description: 'Time slot conflict' },
          },
        },
      },
      '/scheduling/bookings/{id}/status': {
        patch: {
          tags: ['Scheduling'],
          summary: 'Update booking status',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/TenantHeader' },
            { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: {
            status: { type: 'string', enum: ['APPROVED', 'CANCELLED', 'COMPLETED'] },
          } } } } },
          responses: { 200: { description: 'Status updated' } },
        },
      },
      '/scheduling/schedule/weekly': {
        get: {
          tags: ['Scheduling'],
          summary: 'Weekly calendar view',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/TenantHeader' },
            { in: 'query', name: 'week', schema: { type: 'string', format: 'date' }, description: 'Any date in the target week (defaults to current week)' },
          ],
          responses: { 200: { description: 'Bookings grouped by date' } },
        },
      },
      // ── AUDIT ─────────────────────────────────────────────────────
      '/audit': {
        get: {
          tags: ['Audit'],
          summary: 'List audit logs (Admin only)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/TenantHeader' },
            { in: 'query', name: 'page',   schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit',  schema: { type: 'integer', default: 20 } },
            { in: 'query', name: 'action', schema: { type: 'string' }, description: 'Filter by action e.g. LOGIN, BOOKING_CREATED' },
            { in: 'query', name: 'userId', schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { 200: { description: 'Paginated audit log entries', content: { 'application/json': { schema: { type: 'object', properties: {
            logs: { type: 'array', items: { type: 'object', properties: {
              id:            { type: 'string' },
              action:        { type: 'string', example: 'BOOKING_APPROVED' },
              userId:        { type: 'string' },
              tenantId:      { type: 'string' },
              before:        { type: 'object' },
              after:         { type: 'object' },
              correlationId: { type: 'string' },
              createdAt:     { type: 'string', format: 'date-time' },
            } } },
            pagination: { $ref: '#/components/schemas/Pagination' },
          } } } } } },
        },
      },
      // ── FEATURES ──────────────────────────────────────────────────
      '/features': {
        get: {
          tags: ['Features'],
          summary: 'List feature flags (Admin only)',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/TenantHeader' }],
          responses: { 200: { description: 'Feature flags list' } },
        },
      },
      '/features/{id}/toggle': {
        patch: {
          tags: ['Features'],
          summary: 'Toggle feature flag on/off (Admin only)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/TenantHeader' },
            { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { 200: { description: 'Flag toggled', content: { 'application/json': { schema: { type: 'object', properties: {
            id:        { type: 'string' },
            name:      { type: 'string' },
            isEnabled: { type: 'boolean' },
          } } } } } },
        },
      },
    },
  },
  apis: [], // paths defined inline above
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'AIRMAN API Docs',
    customCss: `
      .swagger-ui .topbar { background-color: #1e3a5f; }
      .swagger-ui .topbar-wrapper img { content: url(''); }
      .swagger-ui .topbar-wrapper::after {
        content: '✈ AIRMAN API';
        color: white;
        font-size: 1.2rem;
        font-weight: bold;
        margin-left: 1rem;
      }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
    },
  }));

  // Raw JSON spec endpoint
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 Swagger docs available at http://localhost:4000/api/docs');
};

module.exports = setupSwagger;