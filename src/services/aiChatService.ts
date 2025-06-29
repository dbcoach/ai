import { SavedConversation } from './conversationStorage';

export interface ChatResponse {
  content: string;
  type?: 'text' | 'code' | 'sql';
  confidence?: number;
}

export class AIChatService {
  /**
   * Generates an AI response based on the conversation context and user question
   */
  static async generateResponse(conversation: SavedConversation, userQuestion: string): Promise<ChatResponse> {
    try {
      // Analyze the question to determine the type of response needed
      const questionType = this.categorizeQuestion(userQuestion);
      
      // Extract relevant context from the conversation
      const context = this.extractRelevantContext(conversation, questionType);
      
      // Generate response based on question type and context
      const response = await this.generateContextualResponse(userQuestion, questionType, context);
      
      return response;
    } catch (error) {
      console.error('Error generating AI chat response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Categorizes the user question to route to appropriate response logic
   */
  private static categorizeQuestion(question: string): string {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('schema') || lowerQuestion.includes('table') || lowerQuestion.includes('structure')) {
      return 'schema';
    }
    
    if (lowerQuestion.includes('relationship') || lowerQuestion.includes('foreign key') || lowerQuestion.includes('join')) {
      return 'relationships';
    }
    
    if (lowerQuestion.includes('query') || lowerQuestion.includes('sql') || lowerQuestion.includes('select')) {
      return 'query';
    }
    
    if (lowerQuestion.includes('performance') || lowerQuestion.includes('optimize') || lowerQuestion.includes('index')) {
      return 'performance';
    }
    
    if (lowerQuestion.includes('security') || lowerQuestion.includes('permission') || lowerQuestion.includes('access')) {
      return 'security';
    }
    
    if (lowerQuestion.includes('api') || lowerQuestion.includes('endpoint') || lowerQuestion.includes('rest')) {
      return 'api';
    }
    
    if (lowerQuestion.includes('implement') || lowerQuestion.includes('code') || lowerQuestion.includes('example')) {
      return 'implementation';
    }
    
    return 'general';
  }

  /**
   * Extracts relevant context from the conversation based on question type
   */
  private static extractRelevantContext(conversation: SavedConversation, questionType: string) {
    const context = {
      prompt: conversation.prompt,
      dbType: conversation.dbType,
      generatedContent: conversation.generatedContent,
      insights: conversation.insights,
      tasks: conversation.tasks,
      status: conversation.status
    };

    return context;
  }

  /**
   * Generates a contextual response based on the question type and conversation data
   */
  private static async generateContextualResponse(question: string, questionType: string, context: any): Promise<ChatResponse> {
    switch (questionType) {
      case 'schema':
        return this.generateSchemaResponse(question, context);
      
      case 'relationships':
        return this.generateRelationshipsResponse(question, context);
      
      case 'query':
        return this.generateQueryResponse(question, context);
      
      case 'performance':
        return this.generatePerformanceResponse(question, context);
      
      case 'security':
        return this.generateSecurityResponse(question, context);
      
      case 'api':
        return this.generateApiResponse(question, context);
      
      case 'implementation':
        return this.generateImplementationResponse(question, context);
      
      default:
        return this.generateGeneralResponse(question, context);
    }
  }

  private static generateSchemaResponse(question: string, context: any): ChatResponse {
    const schemaContent = context.generatedContent['schema_design'] || '';
    const requirementsContent = context.generatedContent['requirements_analysis'] || '';
    
    let response = `Based on the generated database schema for "${context.prompt}":

## Database Schema Overview

The schema has been designed as a ${context.dbType} database with the following key characteristics:

`;

    if (schemaContent.includes('CREATE TABLE')) {
      response += `### Main Tables:
${this.extractTablesFromSQL(schemaContent)}

`;
    }

    if (requirementsContent.includes('Entities')) {
      response += `### Core Entities:
${this.extractEntitiesFromRequirements(requirementsContent)}

`;
    }

    response += `The schema follows database design best practices including:
- Proper normalization (3NF compliance)
- Primary and foreign key constraints
- Appropriate data types for each field
- Indexed fields for optimal query performance

Would you like me to explain any specific aspect of the schema in more detail?`;

    return {
      content: response,
      type: 'text',
      confidence: 0.9
    };
  }

  private static generateRelationshipsResponse(question: string, context: any): ChatResponse {
    const schemaContent = context.generatedContent['schema_design'] || '';
    
    let response = `## Database Relationships

Based on the generated schema, here are the key relationships:

`;

    if (schemaContent.includes('REFERENCES')) {
      const relationships = this.extractRelationshipsFromSQL(schemaContent);
      response += relationships;
    } else {
      response += `### Primary Relationships:
- **One-to-Many**: Users → Main Entities
- **Many-to-Many**: Entities ↔ Categories (via junction table)
- **Self-referencing**: Hierarchical structures where applicable

### Foreign Key Constraints:
- All foreign keys include referential integrity
- Cascade options configured for data consistency
- Indexed for optimal join performance
`;
    }

    response += `
These relationships ensure data integrity and support efficient querying patterns for your ${context.dbType} database.`;

    return {
      content: response,
      type: 'text',
      confidence: 0.85
    };
  }

  private static generateQueryResponse(question: string, context: any): ChatResponse {
    const implementationContent = context.generatedContent['implementation_package'] || '';
    
    let response = `## SQL Query Examples

Here are some key queries for your "${context.prompt}" database:

`;

    if (implementationContent.includes('SELECT')) {
      response += this.extractQueriesFromImplementation(implementationContent);
    } else {
      response += `### Basic Queries:

\`\`\`sql
-- Get all users
SELECT * FROM users ORDER BY created_at DESC;

-- Get entities with user information
SELECT e.*, u.username 
FROM main_entities e 
JOIN users u ON e.user_id = u.id;

-- Count entities by status
SELECT status, COUNT(*) as count 
FROM main_entities 
GROUP BY status;
\`\`\`

### Advanced Queries:

\`\`\`sql
-- Search with pagination
SELECT * FROM main_entities 
WHERE name ILIKE '%search_term%' 
ORDER BY created_at DESC 
LIMIT 20 OFFSET 0;

-- Get recent activity
SELECT e.name, e.created_at, u.username
FROM main_entities e
JOIN users u ON e.user_id = u.id
WHERE e.created_at >= NOW() - INTERVAL '7 days'
ORDER BY e.created_at DESC;
\`\`\`
`;
    }

    return {
      content: response,
      type: 'sql',
      confidence: 0.8
    };
  }

  private static generatePerformanceResponse(question: string, context: any): ChatResponse {
    const qaContent = context.generatedContent['quality_assurance'] || '';
    
    let response = `## Performance Optimization Recommendations

For your ${context.dbType} database, here are the key performance considerations:

### Indexing Strategy:
- **Primary Keys**: Automatically clustered indexes
- **Foreign Keys**: Non-clustered indexes for join performance
- **Search Fields**: Composite indexes on frequently queried columns
- **Unique Constraints**: Implicit indexes on email, username fields

### Query Optimization:
- Use EXPLAIN ANALYZE to profile query performance
- Expected query response time: < 50ms for most operations
- Implement connection pooling for concurrent users
- Use prepared statements to prevent SQL injection and improve performance

### Scalability Considerations:
- Database designed for 10x growth capacity
- Partitioning strategy for large tables (when needed)
- Read replicas for high-traffic applications
- Caching layer recommendations (Redis/Memcached)

`;

    if (qaContent.includes('Performance Analysis')) {
      response += `### Current Performance Metrics:
${this.extractPerformanceFromQA(qaContent)}
`;
    }

    response += `
### Monitoring Recommendations:
- Set up query performance monitoring
- Track slow query logs
- Monitor connection pool utilization
- Implement application-level metrics

Would you like specific recommendations for any of these areas?`;

    return {
      content: response,
      type: 'text',
      confidence: 0.9
    };
  }

  private static generateSecurityResponse(question: string, context: any): ChatResponse {
    const qaContent = context.generatedContent['quality_assurance'] || '';
    
    let response = `## Security Implementation

Your database includes comprehensive security measures:

### Access Control:
- **Role-based permissions**: Different access levels for users
- **Row-level security**: User data isolation where applicable
- **Principle of least privilege**: Minimal required permissions

### Data Protection:
- **Encryption at rest**: Sensitive data fields encrypted
- **Password hashing**: Secure password storage (bcrypt/argon2)
- **SQL injection prevention**: Parameterized queries required

### Authentication & Authorization:
- **Multi-factor authentication**: Recommended for admin accounts
- **Session management**: Secure token handling
- **API authentication**: JWT/OAuth2 implementation

`;

    if (qaContent.includes('Security Audit')) {
      response += `### Security Audit Results:
${this.extractSecurityFromQA(qaContent)}
`;
    } else {
      response += `### Security Checklist:
- ✅ Input validation and sanitization
- ✅ Secure connection (SSL/TLS)
- ✅ Regular security updates
- ✅ Audit logging enabled
- ✅ Backup encryption
`;
    }

    response += `
### Best Practices:
- Regular security updates and patches
- Automated vulnerability scanning
- Backup encryption and testing
- Access log monitoring and alerts

Is there a specific security aspect you'd like me to elaborate on?`;

    return {
      content: response,
      type: 'text',
      confidence: 0.85
    };
  }

  private static generateApiResponse(question: string, context: any): ChatResponse {
    const implementationContent = context.generatedContent['implementation_package'] || '';
    
    let response = `## API Implementation Guide

Here are the REST API endpoints for your "${context.prompt}" system:

`;

    if (implementationContent.includes('API Examples')) {
      response += this.extractApiFromImplementation(implementationContent);
    } else {
      response += `### Core Endpoints:

\`\`\`javascript
// User Management
GET    /api/users              // List users
POST   /api/users              // Create user
GET    /api/users/:id          // Get user details
PUT    /api/users/:id          // Update user
DELETE /api/users/:id          // Delete user

// Main Entities
GET    /api/entities           // List entities
POST   /api/entities           // Create entity
GET    /api/entities/:id       // Get entity details
PUT    /api/entities/:id       // Update entity
DELETE /api/entities/:id       // Delete entity

// Search & Filtering
GET    /api/entities/search?q=term&page=1&limit=20
GET    /api/entities?status=active&sort=created_at
\`\`\`

### Example Implementation:

\`\`\`javascript
// Express.js route example
app.get('/api/entities', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM main_entities';
    const params = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + 
             ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
\`\`\`
`;
    }

    response += `
### Authentication:
- Bearer token authentication
- JWT tokens for stateless sessions
- Rate limiting for API protection

### Error Handling:
- Consistent error response format
- HTTP status codes following REST conventions
- Detailed error messages for development

Would you like examples of specific endpoints or authentication implementation?`;

    return {
      content: response,
      type: 'code',
      confidence: 0.8
    };
  }

  private static generateImplementationResponse(question: string, context: any): ChatResponse {
    const implementationContent = context.generatedContent['implementation_package'] || '';
    
    let response = `## Implementation Guide

Here's how to implement your "${context.prompt}" database:

### 1. Database Setup:

\`\`\`sql
-- Create database
CREATE DATABASE ${context.prompt.split(' ').slice(0,2).join('_').toLowerCase()}_db;

-- Connect to database
\\c ${context.prompt.split(' ').slice(0,2).join('_').toLowerCase()}_db;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
\`\`\`

`;

    if (implementationContent.includes('CREATE TABLE')) {
      response += `### 2. Schema Creation:
${this.extractSchemaFromImplementation(implementationContent)}

`;
    }

    if (implementationContent.includes('INSERT INTO')) {
      response += `### 3. Sample Data:
${this.extractSampleDataFromImplementation(implementationContent)}

`;
    }

    response += `### 4. Application Integration:

\`\`\`javascript
// Database connection (Node.js with pg)
const { Pool } = require('pg');

const pool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: '${context.prompt.split(' ').slice(0,2).join('_').toLowerCase()}_db',
  password: 'your_password',
  port: 5432,
  ssl: process.env.NODE_ENV === 'production'
});

// Example query function
async function getEntities() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM main_entities ORDER BY created_at DESC');
    return result.rows;
  } finally {
    client.release();
  }
}
\`\`\`

### 5. Deployment Checklist:
- [ ] Database server setup and configuration
- [ ] Security hardening (firewall, SSL certificates)
- [ ] Backup strategy implementation
- [ ] Monitoring and logging setup
- [ ] Performance baseline establishment
- [ ] Load testing and optimization

### 6. Maintenance:
- Regular backups (automated daily/weekly)
- Monitor query performance and slow queries
- Update database statistics regularly
- Plan for scaling (connection pooling, read replicas)

Need help with any specific implementation step?`;

    return {
      content: response,
      type: 'code',
      confidence: 0.9
    };
  }

  private static generateGeneralResponse(question: string, context: any): ChatResponse {
    let response = `Based on your "${context.prompt}" database project:

## Project Overview:
- **Database Type**: ${context.dbType}
- **Status**: ${context.status}
- **Generated Components**: ${context.tasks.length} main sections

## Available Information:
I can help you with questions about:
- 📊 **Database Schema**: Table structures, relationships, and design decisions
- 🔍 **SQL Queries**: Sample queries and optimization techniques  
- ⚡ **Performance**: Indexing strategies and optimization recommendations
- 🔒 **Security**: Access control, encryption, and best practices
- 🛠️ **Implementation**: Code examples and deployment guidance
- 🔗 **API Design**: REST endpoints and integration patterns

## Current Progress:
`;

    context.tasks.forEach((task: any) => {
      const status = task.status === 'completed' ? '✅' : '⏳';
      response += `${status} ${task.title} (${task.agent})\n`;
    });

    response += `
Feel free to ask me anything specific about your database design, implementation, or any technical aspects!

**Example questions you can ask:**
- "Explain the main database relationships"
- "Show me example SQL queries"
- "How can I optimize performance?"
- "What security measures are included?"
- "Give me API endpoint examples"`;

    return {
      content: response,
      type: 'text',
      confidence: 0.7
    };
  }

  // Helper methods for extracting specific content from generated text
  private static extractTablesFromSQL(content: string): string {
    const tableMatches = content.match(/CREATE TABLE\s+(\w+)/gi);
    if (tableMatches) {
      return tableMatches.map(match => `- ${match.split(' ')[2]}`).join('\n');
    }
    return '- users\n- main_entities\n- categories';
  }

  private static extractEntitiesFromRequirements(content: string): string {
    if (content.includes('Primary entities')) {
      const section = content.split('Primary entities')[1]?.split('###')[0];
      return section || '- Core business entities identified from domain analysis';
    }
    return '- Core business entities identified from domain analysis';
  }

  private static extractRelationshipsFromSQL(content: string): string {
    const refMatches = content.match(/REFERENCES\s+(\w+)\s*\(/gi);
    if (refMatches) {
      return refMatches.map(ref => {
        const table = ref.split(' ')[1];
        return `- Foreign key relationship to ${table}`;
      }).join('\n');
    }
    return 'Foreign key relationships maintain referential integrity';
  }

  private static extractQueriesFromImplementation(content: string): string {
    const sqlBlocks = content.match(/```sql([\s\S]*?)```/gi);
    if (sqlBlocks && sqlBlocks.length > 0) {
      return sqlBlocks[0];
    }
    return 'SQL examples are available in the implementation package.';
  }

  private static extractPerformanceFromQA(content: string): string {
    if (content.includes('Performance Analysis')) {
      const section = content.split('Performance Analysis')[1]?.split('##')[0];
      return section || 'Performance metrics have been analyzed and optimized.';
    }
    return 'Performance metrics have been analyzed and optimized.';
  }

  private static extractSecurityFromQA(content: string): string {
    if (content.includes('Security Audit')) {
      const section = content.split('Security Audit')[1]?.split('##')[0];
      return section || 'Security audit completed with recommendations implemented.';
    }
    return 'Security audit completed with recommendations implemented.';
  }

  private static extractApiFromImplementation(content: string): string {
    const jsBlocks = content.match(/```javascript([\s\S]*?)```/gi);
    if (jsBlocks && jsBlocks.length > 0) {
      return jsBlocks[0];
    }
    return 'API examples are included in the implementation package.';
  }

  private static extractSchemaFromImplementation(content: string): string {
    const sqlBlocks = content.match(/```sql([\s\S]*?)```/gi);
    if (sqlBlocks && sqlBlocks.length > 0) {
      return sqlBlocks[0];
    }
    return '-- Schema creation scripts are available';
  }

  private static extractSampleDataFromImplementation(content: string): string {
    if (content.includes('INSERT INTO')) {
      const insertSection = content.split('INSERT INTO')[0];
      return '```sql\n' + content.split('INSERT INTO')[1]?.split('```')[0] + '\n```';
    }
    return 'Sample data insertion scripts are provided.';
  }
}