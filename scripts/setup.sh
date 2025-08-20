#!/bin/bash

# Drop Craft AI - Initial Setup Script
# Sets up the complete SaaS environment

set -e

echo "🚀 Setting up Drop Craft AI SaaS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Node.js version
check_node_version() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: Node.js is not installed${NC}"
        echo "Please install Node.js 18+ from https://nodejs.org"
        exit 1
    fi
    
    node_version=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$node_version" -lt 18 ]; then
        echo -e "${RED}Error: Node.js version 18+ required (current: $(node -v))${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"
}

# Install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    
    if command -v pnpm &> /dev/null; then
        pnpm install
    elif command -v yarn &> /dev/null; then
        yarn install
    else
        npm install
    fi
    
    echo -e "${GREEN}✓ Dependencies installed${NC}"
}

# Setup environment files
setup_environment() {
    echo "⚙️  Setting up environment files..."
    
    # Copy environment templates
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Created .env from template. Please configure your API keys.${NC}"
    fi
    
    if [ ! -f ".env.local" ]; then
        cp .env.example .env.local
        echo -e "${GREEN}✓ Created .env.local${NC}"
    fi
    
    echo -e "${GREEN}✓ Environment files configured${NC}"
}

# Install CLI tools
install_cli_tools() {
    echo "🛠️  Installing CLI tools..."
    
    # Supabase CLI
    if ! command -v supabase &> /dev/null; then
        echo "Installing Supabase CLI..."
        npm install -g supabase
    fi
    
    # Vercel CLI
    if ! command -v vercel &> /dev/null; then
        echo "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Railway CLI (optional)
    if ! command -v railway &> /dev/null; then
        echo -e "${YELLOW}💡 Optional: Install Railway CLI with 'npm i -g @railway/cli'${NC}"
    fi
    
    echo -e "${GREEN}✓ CLI tools installed${NC}"
}

# Setup Supabase
setup_supabase() {
    echo "🗄️  Setting up Supabase..."
    
    # Link to existing project
    supabase link --project-ref dtozyrmmekdnvekissuh
    
    # Deploy functions
    echo "Deploying edge functions..."
    supabase functions deploy --project-ref dtozyrmmekdnvekissuh
    
    echo -e "${GREEN}✓ Supabase configured${NC}"
}

# Setup Git hooks
setup_git_hooks() {
    echo "🔧 Setting up Git hooks..."
    
    if [ -d ".git" ]; then
        npx husky install
        npx husky add .husky/pre-commit "npx lint-staged"
        npx husky add .husky/pre-push "npm run build"
        echo -e "${GREEN}✓ Git hooks configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Not a Git repository. Skipping Git hooks.${NC}"
    fi
}

# Create necessary directories
create_directories() {
    echo "📁 Creating directories..."
    
    mkdir -p logs
    mkdir -p temp
    mkdir -p public/uploads
    mkdir -p docs/api
    
    echo -e "${GREEN}✓ Directories created${NC}"
}

# Generate initial configuration
generate_config() {
    echo "⚙️  Generating configuration files..."
    
    # Create Docker ignore if needed
    if [ ! -f ".dockerignore" ]; then
        cat > .dockerignore << EOF
node_modules
npm-debug.log
.env
.env.local
.git
.gitignore
README.md
.nyc_output
coverage
.docker
EOF
        echo -e "${GREEN}✓ .dockerignore created${NC}"
    fi
    
    # Create health check endpoint info
    cat > public/health.json << EOF
{
  "status": "healthy",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "database": "connected",
    "integrations": "enabled",
    "ai": "operational"
  }
}
EOF
    
    echo -e "${GREEN}✓ Configuration files generated${NC}"
}

# Main setup process
main() {
    echo -e "${BLUE}🎯 Drop Craft AI SaaS Setup${NC}"
    echo "==============================================="
    
    check_node_version
    install_dependencies
    setup_environment
    install_cli_tools
    setup_git_hooks
    create_directories
    generate_config
    
    echo ""
    echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Configure your API keys in .env file"
    echo "  2. Run 'npm run dev' to start development"
    echo "  3. Visit http://localhost:5173 to see your app"
    echo "  4. Run './scripts/sync-data.sh' to sync initial data"
    echo "  5. Deploy with './scripts/deploy.sh production'"
    echo ""
    echo "🔗 Important links:"
    echo "  • Supabase Dashboard: https://supabase.com/dashboard/project/dtozyrmmekdnvekissuh"
    echo "  • GitHub Repository: https://github.com/adil95400/drop-craft-ai"
    echo "  • Documentation: ./docs/"
    echo ""
    echo "🆘 Need help? Check the README.md or open an issue on GitHub."
}

# Run setup if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi