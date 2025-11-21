# 401(k) Contribution Manager

**Author:** Yernar Smagulov  
**Date:** November 20, 2025

A full-stack web application for managing 401(k) retirement contributions. Users can set their contribution type (percentage or fixed dollar amount), adjust their contribution rate, view YTD data, and see projected retirement savings.

## Demo Video

[Link to demo video]

## Features

- **Contribution Type Toggle**: Switch between percentage of paycheck or fixed dollar amount per paycheck
- **Intuitive Slider Input**: Easily adjust contribution rate with real-time feedback
- **YTD Dashboard**: View total balance, employee contributions, and employer match at a glance
- **Retirement Projections**: Interactive chart showing projected savings at age 65 with 7% annual return
- **Employer Match Calculator**: Real-time calculation of employer match based on your contribution rate
- **Per-Paycheck Breakdown**: See exactly how much goes to retirement each paycheck
- **Input Validation**: Enforces IRS contribution limits ($23,000 for 2024)

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 | UI components and state management |
| Charts | Recharts | Interactive retirement projection visualization |
| Styling | Tailwind CSS | Responsive, utility-first styling |
| Backend | Node.js + Express | REST API server |
| Storage | In-memory | Data persistence (would use PostgreSQL in production) |

## Quick Start

### Prerequisites
- Node.js 16 or higher
- npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ysmagulov02/401k_project.git
   cd 401k_project
   ```

2. **Start the Backend Server**
   ```bash
   cd server
   npm install
   npm start
   ```
   You should see: `401(k) API server running on http://localhost:3001`

3. **Start the Frontend** (open a new terminal)
   ```bash
   cd client
   npm install
   npm start
   ```
   The app will automatically open at `http://localhost:3000`

## Project Structure

```
401k_project/
├── server/
│   ├── server.js          # Express API server with all endpoints
│   └── package.json       # Backend dependencies
├── client/
│   ├── public/
│   │   └── index.html     # HTML entry point with Tailwind CDN
│   ├── src/
│   │   ├── App.jsx        # Main React component
│   │   └── index.js       # React entry point
│   └── package.json       # Frontend dependencies
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user` | Get user profile, salary, and employer match settings |
| GET | `/api/contribution` | Get current contribution type and value |
| PUT | `/api/contribution` | Update contribution settings |
| GET | `/api/projection?contributionPercent=X` | Get retirement projection based on contribution rate |
| GET | `/api/ytd` | Get year-to-date contribution summary |

### Example API Usage

```bash
# Get current contribution settings
curl http://localhost:3001/api/contribution

# Update contribution to 10%
curl -X PUT http://localhost:3001/api/contribution \
  -H "Content-Type: application/json" \
  -d '{"type": "percentage", "value": 10}'
```

## Architecture Decisions

**1. Separate Frontend and Backend**  
Clean separation of concerns allows the API to be consumed by future mobile apps or third-party integrations.

**2. In-Memory Storage**  
Chosen for simplicity in this demo. In production, I would use PostgreSQL for data persistence and add user authentication.

**3. Recharts for Visualization**  
Lightweight, React-native charting library that integrates seamlessly with React state for real-time updates.

**4. Tailwind CSS via CDN**  
Enables rapid prototyping without complex build configuration. Production would use PostCSS for optimized builds.

**5. Real-time Projection Updates**  
The retirement projection recalculates instantly as the user adjusts the slider, providing immediate feedback on long-term impact.

## Future Enhancements

If I had another week to work on this, I would prioritize:

1. **Traditional vs. Roth Selection**  
   Allow users to split contributions between pre-tax (Traditional) and after-tax (Roth) 401(k), with a visualization showing the tax implications of each option at retirement.

2. **Investment Fund Allocation**  
   Add the ability to choose how contributions are invested across different funds (target-date funds, index funds, bonds) with historical performance data.

3. **"What If" Comparison Tool**  
   A side-by-side view showing how different contribution rates affect both take-home pay today and retirement savings in the future, helping users find the right balance.

## Contact

Yernar Smagulov  
GitHub: [@ysmagulov02](https://github.com/ysmagulov02)
