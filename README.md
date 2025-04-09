# MedConnect - DeSci SocialFi Platform

A decentralized science (DeSci) platform built specifically for medical researchers and doctors, featuring a reputation system and SocialFi elements to incentivize high-quality contributions and collaborations.

## Features

### Decentralized Science (DeSci) Framework
- Submit research contributions, papers, and findings
- Peer review system with transparent voting mechanisms
- Blockchain-verified research records and credentials
- Verified contribution badges and achievements

### Reputation System
- Score-based reputation tracking across medical specializations
- Academic, clinical, industry, and research credential verification
- Specialization-specific reputation metrics
- Transparent blockchain verification of credentials

### Token Incentives (SocialFi)
- Earn tokens for valuable research contributions
- Rewards for peer reviewing and validating others' work
- Token incentives for community nomination and upvotes
- Transparent reward system tied to contribution quality

### Collaboration Features
- Contributor co-authorship and attribution system
- Interactive discussion on research contributions
- Nomination mechanism for recognizing excellent research
- Collaborative research project management

## Technical Stack

- **Frontend**: React, Next.js, TypeScript, TailwindCSS
- **Authentication**: Farcaster Auth Kit
- **Blockchain Integration**: Ethereum (via ethers.js)
- **Data Storage**: Local development storage with blockchain hash verification

## Project Structure

```
/src
  /app - Next.js application routes
    /api - Backend API endpoints
      /research - Research-related API endpoints
      /reputation - Reputation-related API endpoints
      /tokens - Token-related API endpoints
    /research - Research pages
    /profile - User profile pages
  /components - React components
  /context - Context providers
  /lib - Service layer with business logic
  /types - TypeScript type definitions
  /utils - Utility functions
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/medconnect.git
cd medconnect
```

2. Install dependencies
```bash
npm install
# or
yarn
```

3. Run the development server
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## System Architecture

### Reputation System
The reputation system tracks contributions across various categories:
- Research papers and findings
- Peer reviews
- Collaboration
- Community engagement

Each action has associated reputation points that contribute to an overall score and specialized field scores. Credentials can be verified on-chain for transparency.

### Token Economy
The platform uses a token incentive system to reward:
- Publishing valuable research
- Providing quality peer reviews
- Nominating exceptional contributions
- Having work verified by peers

Tokens can be earned through positive contributions to the platform ecosystem.

### Blockchain Integration
For development, blockchain interactions are simulated in-memory, but the system is designed to integrate with:
- Ethereum for verification records
- Smart contracts for reputation and token management
- Decentralized credential verification

## API Structure

### Research Contributions
- `GET /api/research/contributions` - List contributions with filters
- `POST /api/research/contributions` - Create new contribution
- `GET /api/research/contributions/:id` - Get specific contribution
- `POST /api/research/contributions/:id/reviews` - Submit a review
- `GET /api/research/contributions/:id/reviews` - Get reviews for a contribution
- `POST /api/research/contributions/:id/nominate` - Nominate a contribution

### Reputation
- `GET /api/reputation/:fid` - Get user reputation
- `POST /api/reputation/:fid` - Verify credentials

### Tokens
- `GET /api/tokens/balance/:fid` - Get token balance

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Deployment to cPanel

Follow these steps to deploy this application to cPanel:

1. **Prepare the build**:
   ```bash
   # Run the deployment script
   bash deploy-cpanel.sh
   ```
   This will create a `build.zip` file containing the standalone Next.js application.

2. **Upload to cPanel**:
   - Log in to your cPanel account
   - Navigate to File Manager
   - Go to the directory where you want to deploy the app (usually `public_html`)
   - Upload `build.zip` and extract it

3. **Configure .htaccess**:
   - Make sure the `.htaccess` file from this repository is uploaded to the same directory
   - If it doesn't exist, create it with the content provided in this repository

4. **Environment Variables**:
   - Ensure your environment variables are properly set
   - You can configure them through cPanel's .env file or modify the .env.production file before deployment

5. **Testing**:
   - Visit your domain to ensure the application is running correctly
   - Check the browser console for any errors related to API connections or environment variables

## Troubleshooting

If you encounter issues with the deployment:

- Make sure all file permissions are set correctly (typically 644 for files and 755 for directories)
- Check if the server has all the required modules enabled (like mod_rewrite)
- Ensure your domain's DNS is properly configured
- Verify that the API endpoints in the environment variables are correct and accessible from your server

## Farcaster Integration

### Local Hubble Node
By default, the application is set up to work with a local Farcaster Hubble node. You can configure the connection URLs in your environment variables:

```
NEXT_PUBLIC_HUBBLE_HTTP_URL=http://localhost:2281
NEXT_PUBLIC_HUBBLE_GRPC_URL=http://localhost:2283
```

### Using Neynar API (Recommended)
As an alternative to running a local Hubble node, you can use Neynar's API which provides a managed Farcaster node service:

1. **Set up Neynar API Key**:
   - Sign up for an API key at [Neynar](https://neynar.com)
   - Add the following to your `.env.local` file:
   ```
   NEXT_PUBLIC_NEYNAR_API_KEY=your-api-key-here
   NEXT_PUBLIC_USE_NEYNAR_API=true
   ```

2. **Benefits of using Neynar**:
   - No need to run and maintain a local Hubble node
   - Better reliability and uptime
   - Full integration with Farcaster for both reading and writing data
   - All social actions (posts, comments, reactions, follows) are directly saved to Farcaster

3. **How it works**:
   - The application automatically detects when Neynar API is enabled
   - All Farcaster data operations are redirected to Neynar's endpoints
   - Local storage is still maintained as a fallback but all operations attempt to use Neynar first
   - User interactions like posting, commenting, and reacting will be reflected in the actual Farcaster network

By using Neynar, your Social UI instance becomes fully integrated with the Farcaster network, with all user actions being saved to and read from the live Farcaster ecosystem.
