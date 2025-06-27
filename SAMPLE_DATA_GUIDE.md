# Sample Data Generation Guide - DB.Coach

## Overview

DB.Coach includes two distinct sample data generation features to help you work with realistic database content. This guide explains how to access and use both features effectively.

## Feature 1: AI-Generated Sample Data (Primary Feature)

### Location & Access Path

1. **Start from Landing Page**: Enter your database description and click "Generate Design"
2. **Navigate to Results**: After AI generation completes, you'll see the Generation View with multiple tabs
3. **Access Sample Data Tab**: 
   - Click the "Implementation" tab (Code icon)
   - Select the "Sample Data" section within the Implementation tab

### AI-Generated Sample Data Features

#### What It Provides
- **SQL INSERT statements** tailored to your specific database schema
- **Realistic data** that matches your business domain and context
- **Proper relationships** between tables with valid foreign keys
- **Domain-specific content** (e.g., e-commerce products, user profiles, financial transactions)

#### Export Options
- **Export CSV**: Download data in comma-separated values format
- **Export JSON**: Download data in JSON format for API testing

#### Usage Tips
- The data is automatically generated based on your prompt and database type
- Content reflects the complexity and scale mentioned in your initial description
- Foreign key relationships are properly maintained
- Data volume scales with your specified requirements

### Navigation Path Summary
```
Landing Page → Generate Design → Implementation Tab → Sample Data Section
```

## Feature 2: Interactive Sample Data Generator Tool

### Location & Access Path

This standalone tool is accessible through the Sample Data Generator component, typically found in:
- Development/testing environments
- Demo pages within the application
- Tool integrations for advanced users

### Interactive Generator Features

#### Generation Controls
- **Record Count**: Set the number of sample projects to generate (1-1000)
- **Export Format**: Choose between JSON or CSV output
- **Generate Button**: Create new sample data instantly
- **Export Button**: Download generated data in your chosen format

#### Data Categories
The generator creates realistic database project data across 8 business domains:
- **E-commerce**: Online stores, marketplaces, product catalogs
- **SaaS**: Project management, CRM, collaboration platforms  
- **Social**: Networking sites, forums, content sharing
- **Blog**: Content management, publishing platforms
- **Financial**: Banking, payment processing, investment tracking
- **Healthcare**: Patient records, medical systems, HIPAA compliance
- **IoT**: Sensor networks, device management, data collection
- **Education**: Learning platforms, student management, course systems

#### Advanced Filtering & Search
- **Search Bar**: Find projects by name, description, owner, or tags
- **Domain Filter**: Filter by business domain (e-commerce, SaaS, etc.)
- **Status Filter**: Filter by project status (draft, in progress, completed, etc.)
- **Real-time Results**: Filters update the display immediately

#### Analytics Dashboard
Enable the analytics view to see:
- **Project Distribution**: Visual breakdown by business domain
- **Quality Scores**: Average quality metrics across all projects
- **Statistics Cards**: Total projects, users, domains, and average quality
- **Interactive Charts**: Progress charts and score visualizations

#### Data Fields Generated
Each sample project includes:
- **Basic Info**: Name, description, creation date, status
- **Technical Details**: Database type, table count, estimated users
- **Quality Metrics**: Syntax, logic, performance, security scores
- **Project Management**: Owner details, priority, completion estimates
- **Categorization**: Domain, scale, complexity, tags

### Using the Interactive Generator

#### Step 1: Configure Generation
1. Set the **Number of Records** (default: 10, max: 1000)
2. Choose your **Export Format** (JSON or CSV)
3. Click **Generate Data** to create sample projects

#### Step 2: Explore Generated Data
1. Use the **search bar** to find specific projects
2. Apply **domain and status filters** to narrow results
3. Toggle **Analytics** to view data visualizations
4. Review the **data table** for detailed project information

#### Step 3: Export Your Data
1. Ensure you have the data you want (use filters if needed)
2. Click **Export** to download in your selected format
3. The file will be named with the current date: `database-projects-YYYY-MM-DD.json/csv`

## Best Practices

### For AI-Generated Sample Data
- **Be specific** in your initial database description for more relevant sample data
- **Mention data volume** requirements (e.g., "10,000 users", "small shop") for appropriate scaling
- **Include business context** to get domain-appropriate sample data
- **Export both formats** for different use cases (CSV for spreadsheets, JSON for APIs)

### For Interactive Generator
- **Start small** with 10-50 records to understand the data structure
- **Use filters** to focus on specific business domains or project states
- **Enable analytics** to understand data distribution and quality patterns
- **Export regularly** to save different data sets for various testing scenarios

## Technical Notes

### Data Realism
- All generated data uses realistic business names, descriptions, and metrics
- Quality scores follow industry-standard ranges (60-95%)
- User counts scale appropriately with project complexity
- Creation dates span realistic timeframes

### Performance Considerations
- Generation is optimized for up to 1000 records
- Large datasets may take a few seconds to generate
- Filtering and search operate on client-side for fast response
- Export functions handle large datasets efficiently

### Security & Privacy
- All sample data is completely synthetic
- No real personal information is included
- Data generation occurs locally in your browser
- Export files contain only generated sample data

## Troubleshooting

### AI-Generated Sample Data Issues
- **No data shown**: Ensure the AI generation completed successfully
- **Generic data**: Provide more specific business context in your initial prompt
- **Export not working**: Check browser permissions for file downloads

### Interactive Generator Issues
- **Slow generation**: Reduce record count or refresh the page
- **Filters not working**: Clear search terms and reset filters
- **Export fails**: Ensure popup blockers aren't preventing downloads

## Support

For additional help with sample data generation:
- Check the main README.md for general setup instructions
- Review the database schema generation guide for context
- Contact support through the application's help section

---

*This guide covers both sample data features in DB.Coach. The AI-generated feature provides schema-specific realistic data, while the interactive generator offers standalone database project samples for testing and demonstration.*