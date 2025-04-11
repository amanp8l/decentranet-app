# DecentraNet - Advancing Open Science through Web3

DecentraNet is a cutting-edge decentralized science (DeSci) platform that revolutionizes how medical researchers and scientists collaborate, validate, and monetize their work. By leveraging blockchain technology and Web3 principles, we're building a more transparent, equitable, and efficient scientific ecosystem.

[![DeSci Bounty](https://img.shields.io/badge/Bounty-DeSci-blueviolet)](https://dorahacks.io/hackathon/bounty/1017)

## 🔬 The DeSci Revolution

Decentralized Science (DeSci) is transforming traditional scientific research by:

- **Eliminating Gatekeepers**: Removing intermediaries that restrict access to scientific knowledge
- **Democratizing Funding**: Creating new incentive models for scientific research
- **Verifying Research**: Using blockchain to establish immutable proof of scientific claims
- **Opening Access**: Making research findings available to everyone, not just those who can afford journal subscriptions
- **Rewarding Contribution**: Creating token-based incentives for peer review and collaboration

## ✨ Core Features

### 🧬 Decentralized Research Framework
- Submit verifiable research contributions and findings on-chain
- Access a transparent peer review system with cryptographic verification
- Get blockchain-verified research records and credentials
- Showcase verifiable contribution badges and achievements

### 🏆 Reputation System
- Build your scientific reputation through a transparent on-chain scoring system
- Verify academic, clinical, and research credentials with blockchain attestations
- Develop reputation in specialized medical fields
- Transfer your reputation across institutions and platforms

### 💰 Token Economy (SocialFi)
- Earn tokens for high-quality research contributions
- Receive rewards for peer reviewing and validating other researchers' work
- Get token incentives through community voting and recognition
- Participate in a transparent token reward system based on contribution quality

### 👥 Collaboration Hub
- Co-author research with cryptographic proof of contribution
- Engage in on-chain discussions about scientific contributions
- Nominate and recognize excellent research through verifiable processes
- Manage collaborative research projects with transparent attribution

## 🛠️ Technical Stack

- **Frontend**: React, Next.js 15+, TypeScript, TailwindCSS
- **Authentication**: Farcaster Auth Kit for Web3 identity
- **Blockchain**: Ethereum integration via ethers.js
- **Data Storage**: Hybrid storage with on-chain verification hashes
- **Social Layer**: Farcaster integration for discussions and community

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Basic understanding of Web3 concepts

### Installation

1. Clone the repository
```bash
git clone https://github.com/amanp8l/decentranet-app.git
cd decentranet-app
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

## 🏗️ System Architecture

### Reputation and Credentialing
Our blockchain-based reputation system tracks contributions across:
- Research papers and findings
- Peer reviews
- Collaboration activities
- Community engagement

Each verified action has associated reputation points that contribute to an overall reputation score, with specialized field scores for different medical disciplines.

### Token Economy
DecentraNet uses a token incentive system to reward:
- Publishing verified research
- Providing quality peer reviews
- Nominating exceptional contributions
- Receiving peer verification

Tokens can be earned through positive contributions to the scientific ecosystem, creating economic incentives for good science.

### Web3 Integration
DecentraNet leverages blockchain technology for:
- Immutable verification records
- Smart contracts for reputation and token management
- Decentralized credential verification
- Trustless peer review processes

## 🌐 Addressing DeSci Challenges

DecentraNet tackles core issues in scientific research:

- **Publication Bias**: Creating incentives for publishing all results, including negative findings
- **Replication Crisis**: Encouraging verification and reproduction of research
- **Access Inequality**: Making research available without costly journal subscriptions
- **Funding Bottlenecks**: Developing alternative funding mechanisms through token economics
- **Attribution Problems**: Ensuring proper credit for all contributors to scientific work

## 🤝 Contributing

We welcome contributions from developers, scientists, and DeSci enthusiasts! Please feel free to submit a Pull Request or open an Issue to discuss potential changes.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Farcaster Integration

DecentraNet integrates with Farcaster's social protocol to create a vibrant community of scientific discussion and collaboration.

### Local Hubble Node Setup
Configure connection to a local Farcaster Hubble node:

```
NEXT_PUBLIC_HUBBLE_HTTP_URL=http://localhost:2281
NEXT_PUBLIC_HUBBLE_GRPC_URL=http://localhost:2283
```

### Using Neynar API (Recommended)
For simplified integration, use Neynar's API:

1. Get your API key at [Neynar](https://neynar.com)
2. Configure in your `.env.local` file:
```
NEXT_PUBLIC_NEYNAR_API_KEY=your-api-key-here
NEXT_PUBLIC_USE_NEYNAR_API=true
```

---

**DecentraNet** is committed to building the future of open, verifiable, and incentivized scientific research. Join us in revolutionizing how science is conducted, verified, and rewarded in the Web3 era.
