# DB.Coach - Premium Database Design Studio

**Design Databases at the Speed of Thought**

DB.Coach is an AI-powered database design tool that helps you create comprehensive database schemas, sample data, API endpoints, and visualizations from simple natural language descriptions.

## Features

- **AI-Powered Database Design**: Powered by Google's Gemini 1.5 Flash model for intelligent database design
- **Multi-Database Support**: SQL, NoSQL, and VectorDB support
- **Real-time AI Reasoning**: Watch the AI work through your requirements step-by-step
- **Progressive Generation**: 
  - Database schemas with proper relationships and indexes
  - Realistic sample data that matches your business context
  - Complete REST API endpoint documentation
  - Database visualization descriptions
- **Professional UI**: Modern, responsive interface with dark theme
- **Error Handling**: Robust error handling with retry logic and user-friendly messages

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **AI Integration**: Google Gemini 1.5 Flash API
- **State Management**: React Context + useReducer
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Development**: ESLint, TypeScript strict mode

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/dbcoach/ai.git
cd ai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your Gemini API key

# Start the development server
npm run dev
```

### API Key Setup

1. Get your Gemini API key:
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Copy the generated key

2. Configure the environment:
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Add your API key to .env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. Start the application:
   ```bash
   npm run dev
   ```

### Build for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── LandingPage.tsx          # Main input interface
│   ├── GenerationView.tsx       # Results display with tabs
│   ├── AIReasoningPanel.tsx     # Real-time AI reasoning display
│   └── tabs/
│       ├── SchemaTab.tsx        # Database schema display
│       ├── SampleDataTab.tsx    # Sample data generation
│       ├── APIEndpointsTab.tsx  # API documentation
│       └── VisualizationTab.tsx # Database visualizations
├── App.tsx                      # Main application component
├── main.tsx                     # Application entry point
└── index.css                    # Global styles
```

## Usage

1. **Choose Database Type**: Select from SQL, NoSQL, or VectorDB
2. **Describe Your Database**: Enter a natural language description of your database needs
3. **Generate Design**: Click "Generate Database Design" to start the AI process
4. **Explore Results**: Review the generated schema, sample data, API endpoints, and visualizations

### Example Prompts

- "A blog platform with users, posts, and comments"
- "E-commerce system with products, orders, and customer management"
- "Task management app with projects, tasks, and team collaboration"

## Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Configuration

- **TypeScript**: Strict mode enabled with modern ES2020 target
- **Vite**: Optimized for React with lucide-react exclusion
- **Tailwind**: Configured for all source files
- **ESLint**: Modern configuration with React hooks support

## Features in Detail

### AI Reasoning Panel
Watch the AI work through your database design requirements in real-time, showing the thought process behind each decision.

### Schema Generation
Generate production-ready SQL schemas with:
- Proper table relationships
- Foreign key constraints
- Performance indexes
- Data type optimization

### Sample Data
Realistic sample data that matches your schema structure and business logic.

### API Endpoints
RESTful API documentation with endpoints for CRUD operations on your database entities.

### Visualizations
Interactive database diagrams showing entity relationships and schema structure.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
