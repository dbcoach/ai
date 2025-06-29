import { SavedConversation } from './conversationStorage';

interface ChatResponse {
  content: string;
  type: 'text' | 'code' | 'sql';
}

/**
 * AI Chat Service for database conversation assistance
 * Analyzes generated database content and provides intelligent responses
 */
export class AIChatService {
  
  /**
   * Generate intelligent response based on conversation data and user question
   */
  static async generateResponse(
    conversation: SavedConversation, 
    userQuestion: string
  ): Promise<ChatResponse> {
    
    const context = this.buildConversationContext(conversation);
    const questionType = this.analyzeQuestionType(userQuestion);
    
    // Route to appropriate response generator
    switch (questionType) {
      case 'schema':
        return this.generateSchemaResponse(conversation, userQuestion, context);
      case 'query':
        return this.generateQueryResponse(conversation, userQuestion, context);
      case 'performance':
        return this.generatePerformanceResponse(conversation, userQuestion, context);
      case 'security':
        return this.generateSecurityResponse(conversation, userQuestion, context);
      case 'requirements':
        return this.generateRequirementsResponse(conversation, userQuestion, context);
      case 'api':
        return this.generateAPIResponse(conversation, userQuestion, context);
      default:
        return this.generateGeneralResponse(conversation, userQuestion, context);
    }
  }

  /**
   * Build comprehensive context from conversation data
   */
  private static buildConversationContext(conversation: SavedConversation): string {
    const content = conversation.generatedContent;
    
    return `
DATABASE PROJECT CONTEXT:
=========================
Title: ${conversation.title}
Original Request: ${conversation.prompt}
Database Type: ${conversation.dbType}
Generated: ${new Date(conversation.createdAt).toLocaleDateString()}

REQUIREMENTS ANALYSIS:
${content.requirements_analysis || 'Not available'}

SCHEMA DESIGN:
${content.schema_design || 'Not available'}

IMPLEMENTATION:
${content.implementation_package || 'Not available'}

QUALITY ASSURANCE:
${content.quality_assurance || 'Not available'}

AI INSIGHTS:
${conversation.insights.map(i => `[${i.agent}]: ${i.message}`).join('\n')}
    `.trim();
  }

  /**
   * Analyze question type for routing
   */
  private static analyzeQuestionType(question: string): string {
    const q = question.toLowerCase();
    
    if (q.includes('table') || q.includes('column') || q.includes('schema') || q.includes('structure') || q.includes('relationship')) {
      return 'schema';
    }
    if (q.includes('query') || q.includes('select') || q.includes('join') || q.includes('where') || q.includes('sql')) {
      return 'query';
    }
    if (q.includes('performance') || q.includes('optimize') || q.includes('index') || q.includes('slow') || q.includes('fast')) {
      return 'performance';
    }
    if (q.includes('security') || q.includes('permission') || q.includes('auth') || q.includes('role') || q.includes('access')) {
      return 'security';
    }
    if (q.includes('requirement') || q.includes('feature') || q.includes('business') || q.includes('purpose')) {
      return 'requirements';
    }
    if (q.includes('api') || q.includes('endpoint') || q.includes('rest') || q.includes('graphql')) {
      return 'api';
    }
    
    return 'general';
  }

  /**
   * Generate schema-related responses
   */
  private static async generateSchemaResponse(
    conversation: SavedConversation, 
    question: string, 
    context: string
  ): Promise<ChatResponse> {
    
    const schemaContent = conversation.generatedContent.schema_design || '';
    
    // Extract table names from schema
    const tableMatches = schemaContent.match(/CREATE TABLE\s+(\w+)/gi) || [];
    const tables = tableMatches.map(match => match.replace(/CREATE TABLE\s+/i, ''));
    
    // Extract relationships
    const foreignKeyMatches = schemaContent.match(/REFERENCES\s+(\w+)\s*\(/gi) || [];
    const relationships = foreignKeyMatches.map(match => 
      match.replace(/REFERENCES\s+/i, '').replace(/\s*\(/g, '')
    );

    if (question.toLowerCase().includes('table')) {
      return {
        content: `## Database Tables

Your **${conversation.title}** database contains ${tables.length} main tables:

${tables.map(table => `• **${table}** - ${this.getTableDescription(table, schemaContent)}`).join('\n')}

### Key Relationships:
${relationships.length > 0 ? relationships.map(rel => `• References to **${rel}** table`).join('\n') : 'No foreign key relationships defined'}

### Schema Overview:
\`\`\`sql
${schemaContent.substring(0, 800)}${schemaContent.length > 800 ? '...' : ''}
\`\`\`

Would you like me to explain any specific table or relationship in detail?`,
        type: 'code'
      };
    }

    if (question.toLowerCase().includes('relationship')) {
      return {
        content: `## Database Relationships

Your **${conversation.title}** database has the following relationship structure:

### Foreign Key Relationships:
${relationships.length > 0 ? 
  relationships.map(rel => `• **→ ${rel}** (referenced by other tables)`).join('\n') :
  'This schema uses a simple structure with minimal foreign key constraints.'
}

### Relationship Patterns:
• **One-to-Many**: Users can have multiple records in related tables
• **Many-to-Many**: Implemented through junction tables where needed
• **Self-referencing**: Hierarchical relationships where applicable

### Entity Relationship Diagram Structure:
\`\`\`
${tables.join(' ← → ')}
\`\`\`

This design ensures data integrity while maintaining query performance. Would you like me to explain a specific relationship or suggest optimizations?`,
        type: 'text'
      };
    }

    return {
      content: `## Database Schema Analysis

Your **${conversation.title}** database schema includes:

**Tables:** ${tables.length} main entities
**Relationships:** ${relationships.length} foreign key references
**Database Type:** ${conversation.dbType}

### Key Schema Features:
• **Normalized Design**: Tables follow database normalization principles
• **Primary Keys**: Each table has a unique identifier
• **Data Types**: Appropriate column types for performance
• **Constraints**: Foreign keys and validation rules

\`\`\`sql
-- Example table structure
${schemaContent.split('\n').slice(0, 20).join('\n')}
\`\`\`

What specific aspect of the schema would you like me to explain further?`,
      type: 'code'
    };
  }

  /**
   * Generate SQL query responses
   */
  private static async generateQueryResponse(
    conversation: SavedConversation, 
    question: string, 
    context: string
  ): Promise<ChatResponse> {
    
    const schemaContent = conversation.generatedContent.schema_design || '';
    const implementationContent = conversation.generatedContent.implementation_package || '';
    
    // Extract first table name for examples
    const tableMatch = schemaContent.match(/CREATE TABLE\s+(\w+)/i);
    const mainTable = tableMatch ? tableMatch[1] : 'users';
    
    // Extract column names from the first table
    const tableBlock = schemaContent.split('CREATE TABLE')[1]?.split(');')[0] || '';
    const columnMatches = tableBlock.match(/(\w+)\s+(VARCHAR|INT|SERIAL|TEXT|TIMESTAMP)/gi) || [];
    const columns = columnMatches.map(match => match.split(' ')[0]).slice(0, 5);

    return {
      content: `## SQL Queries for ${conversation.title}

Here are useful SQL queries for your **${conversation.dbType}** database:

### Basic Queries:
\`\`\`sql
-- Select all records
SELECT * FROM ${mainTable};

-- Select with conditions
SELECT ${columns.slice(0, 3).join(', ')} 
FROM ${mainTable} 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Count records
SELECT COUNT(*) as total_records FROM ${mainTable};
\`\`\`

### Advanced Queries:
\`\`\`sql
-- Join multiple tables
SELECT m.*, u.username 
FROM main_entities m
JOIN users u ON m.user_id = u.id
ORDER BY m.created_at DESC;

-- Aggregate data
SELECT DATE(created_at) as date, COUNT(*) as daily_count
FROM ${mainTable}
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Search functionality
SELECT * FROM ${mainTable}
WHERE ${columns[1] || 'name'} ILIKE '%search_term%'
LIMIT 20;
\`\`\`

### Performance-Optimized Queries:
\`\`\`sql
-- With indexes for better performance
CREATE INDEX idx_${mainTable}_created_at ON ${mainTable}(created_at);
CREATE INDEX idx_${mainTable}_status ON ${mainTable}(status);

-- Optimized pagination
SELECT * FROM ${mainTable}
WHERE id > :last_id
ORDER BY id
LIMIT 20;
\`\`\`

What specific type of query are you looking to create?`,
      type: 'sql'
    };
  }

  /**
   * Generate performance optimization responses
   */
  private static async generatePerformanceResponse(
    conversation: SavedConversation, 
    question: string, 
    context: string
  ): Promise<ChatResponse> {
    
    return {
      content: `## Performance Optimization for ${conversation.title}

### Database-Level Optimizations:

**Indexing Strategy:**
\`\`\`sql
-- Primary indexes for frequent queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_entities_user_id ON main_entities(user_id);
CREATE INDEX idx_entities_created_at ON main_entities(created_at DESC);

-- Composite indexes for complex queries
CREATE INDEX idx_entities_status_date ON main_entities(status, created_at);
\`\`\`

**Query Optimization:**
• Use EXPLAIN ANALYZE to identify slow queries
• Implement proper WHERE clause ordering
• Avoid SELECT * in production queries
• Use LIMIT for large result sets

**Connection Management:**
• Implement connection pooling (recommended: 10-20 connections)
• Use read replicas for read-heavy workloads
• Configure query timeout limits

### Application-Level Optimizations:

**Caching Strategy:**
• **Redis**: Cache frequently accessed data
• **Application-level**: Cache query results for 5-15 minutes
• **CDN**: Cache static content and API responses

**Database Configuration:**
\`\`\`
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
\`\`\`

### Monitoring & Metrics:
• Query execution time < 100ms for 95% of queries
• Connection pool utilization < 80%
• Cache hit ratio > 90%

Would you like specific recommendations for any particular performance concern?`,
      type: 'code'
    };
  }

  /**
   * Generate security-related responses
   */
  private static async generateSecurityResponse(
    conversation: SavedConversation, 
    question: string, 
    context: string
  ): Promise<ChatResponse> {
    
    return {
      content: `## Security Recommendations for ${conversation.title}

### Authentication & Authorization:

**Row-Level Security (RLS):**
\`\`\`sql
-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE main_entities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can only access own data" ON main_entities
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can access all data" ON main_entities
  FOR ALL USING (auth.role() = 'admin');
\`\`\`

**Input Validation:**
• Always use parameterized queries to prevent SQL injection
• Validate all user inputs on both client and server
• Implement rate limiting on API endpoints
• Use prepared statements for all database operations

### Data Protection:

**Encryption:**
\`\`\`sql
-- Encrypt sensitive columns
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Store encrypted data
INSERT INTO users (email, password_hash) 
VALUES ('user@email.com', crypt('password', gen_salt('bf')));

-- Verify passwords
SELECT * FROM users 
WHERE password_hash = crypt('input_password', password_hash);
\`\`\`

**Access Control:**
• Implement role-based permissions
• Use least-privilege principle for database users
• Regular audit of user permissions
• Enable audit logging for sensitive operations

### Network Security:
• Use SSL/TLS for all database connections
• Implement VPC/private networks for database access
• Configure firewall rules to restrict database access
• Regular security updates and patches

### Compliance Considerations:
• **GDPR**: Implement data deletion and export features
• **HIPAA**: Add additional encryption for healthcare data
• **SOC 2**: Implement comprehensive audit logging

What specific security aspect would you like me to elaborate on?`,
      type: 'code'
    };
  }

  /**
   * Generate requirements-related responses
   */
  private static async generateRequirementsResponse(
    conversation: SavedConversation, 
    question: string, 
    context: string
  ): Promise<ChatResponse> {
    
    const reqContent = conversation.generatedContent.requirements_analysis || '';
    
    return {
      content: `## Requirements Analysis for ${conversation.title}

### Original Request:
"${conversation.prompt}"

### Identified Requirements:

${reqContent.includes('Functional Requirements') ? 
  reqContent.substring(reqContent.indexOf('Functional Requirements'), reqContent.indexOf('Non-Functional') || reqContent.length) :
  `**Core Functionality:**
• Data storage and retrieval
• User management and authentication
• Business logic implementation
• Reporting and analytics capabilities`
}

### Business Goals:
• **Scalability**: Support growing user base and data volume
• **Performance**: Fast query response times (< 100ms)
• **Reliability**: 99.9% uptime with proper backup systems
• **Security**: Protect sensitive user and business data

### Technical Requirements:
• **Database**: ${conversation.dbType} with proper indexing
• **API**: RESTful endpoints for data access
• **Authentication**: Secure user login and session management
• **Backup**: Daily automated backups with point-in-time recovery

### Success Metrics:
• Query performance benchmarks
• User adoption and engagement rates
• System reliability and uptime
• Security audit compliance

### Future Considerations:
• Integration with third-party services
• Advanced analytics and reporting
• Mobile application support
• Multi-tenant architecture

Would you like me to elaborate on any specific requirement or discuss implementation priorities?`,
      type: 'text'
    };
  }

  /**
   * Generate API-related responses
   */
  private static async generateAPIResponse(
    conversation: SavedConversation, 
    question: string, 
    context: string
  ): Promise<ChatResponse> {
    
    const implementationContent = conversation.generatedContent.implementation_package || '';
    
    return {
      content: `## API Design for ${conversation.title}

### RESTful Endpoints:

**User Management:**
\`\`\`javascript
// Authentication
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/profile

// User operations
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
\`\`\`

**Core Entity Operations:**
\`\`\`javascript
// Main entities CRUD
GET    /api/entities?page=1&limit=20&filter=status:active
POST   /api/entities
GET    /api/entities/:id
PUT    /api/entities/:id
DELETE /api/entities/:id

// Advanced queries
GET    /api/entities/search?q=term
GET    /api/entities/stats
GET    /api/entities/export
\`\`\`

### API Implementation Examples:

**Express.js Route Handler:**
\`\`\`javascript
// GET /api/entities
app.get('/api/entities', async (req, res) => {
  try {
    const { page = 1, limit = 20, filter } = req.query;
    const offset = (page - 1) * limit;
    
    let query = \`
      SELECT * FROM main_entities 
      WHERE user_id = $1
    \`;
    
    if (filter) {
      query += \` AND status = $2\`;
    }
    
    query += \` ORDER BY created_at DESC LIMIT $\${filter ? 3 : 2} OFFSET $\${filter ? 4 : 3}\`;
    
    const result = await db.query(query, [
      req.user.id, 
      ...(filter ? [filter.split(':')[1]] : []),
      limit, 
      offset
    ]);
    
    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rowCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
\`\`\`

**Error Handling & Validation:**
\`\`\`javascript
// Input validation middleware
const validateEntity = (req, res, next) => {
  const { name, description } = req.body;
  
  if (!name || name.length < 3) {
    return res.status(400).json({ 
      error: 'Name must be at least 3 characters' 
    });
  }
  
  next();
};

// Global error handler
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ 
    error: 'Internal server error',
    requestId: req.id 
  });
});
\`\`\`

### API Security:
• JWT token authentication
• Rate limiting (100 requests/minute per user)
• Input sanitization and validation
• CORS configuration for allowed origins

What specific API endpoint or functionality would you like me to detail further?`,
      type: 'code'
    };
  }

  /**
   * Generate general responses
   */
  private static async generateGeneralResponse(
    conversation: SavedConversation, 
    question: string, 
    context: string
  ): Promise<ChatResponse> {
    
    return {
      content: `## About Your ${conversation.title} Database

I can help you understand and work with your **${conversation.dbType}** database project. Here's what I know about your system:

### Project Overview:
• **Original Request**: "${conversation.prompt}"
• **Database Type**: ${conversation.dbType}
• **Generated Components**: ${conversation.tasks.length} completed tasks
• **Creation Date**: ${new Date(conversation.createdAt).toLocaleDateString()}

### Available Information:
${Object.keys(conversation.generatedContent).map(key => 
  `• **${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}**: Complete analysis and implementation details`
).join('\n')}

### What I Can Help With:
• **Schema Questions**: Table structures, relationships, and design decisions
• **SQL Queries**: Writing efficient queries for your specific schema
• **Performance**: Optimization strategies and indexing recommendations
• **Security**: Best practices for data protection and access control
• **API Design**: RESTful endpoints and integration patterns
• **Requirements**: Understanding business needs and technical specifications

### Quick Actions:
To get started, try asking me:
• "Explain the database schema"
• "Show me example SQL queries"
• "How can I optimize performance?"
• "What are the security considerations?"

What would you like to explore about your database project?`,
      type: 'text'
    };
  }

  /**
   * Helper method to get table description
   */
  private static getTableDescription(tableName: string, schemaContent: string): string {
    if (tableName.toLowerCase().includes('user')) return 'User authentication and profile data';
    if (tableName.toLowerCase().includes('entity') || tableName.toLowerCase().includes('main')) return 'Core business entities';
    if (tableName.toLowerCase().includes('session')) return 'User session management';
    if (tableName.toLowerCase().includes('log')) return 'System activity logging';
    if (tableName.toLowerCase().includes('setting')) return 'Configuration and preferences';
    return 'Application data storage';
  }
}

// Export for use in chat component
export { AIChatService };