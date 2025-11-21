const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// In-memory storage (would be a database in production)
let userData = {
  id: 1,
  name: "Yernar Smagulov",
  email: "yernar.smagulov@example.com",
  dateOfBirth: "2002-03-22",
  hireDate: "2020-06-01",
  annualSalary: 85000,
  payFrequency: "biweekly", // 26 paychecks per year
  contribution: {
    type: "percentage", // "percentage" or "fixed"
    value: 6, // 6% or $amount
    lastUpdated: "2025-11-20"
  },
  employerMatch: {
    matchPercent: 50, // employer matches 50% of contribution
    maxMatchPercent: 6 // up to 6% of salary
  },
  ytdData: {
    employeeContributions: 4000,
    employerContributions: 2000,
    totalBalance: 20000,
    paychecksProcessed: 16
  }
};

// GET user profile and contribution settings
app.get('/api/user', (req, res) => {
  const age = Math.floor((new Date() - new Date(userData.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
  res.json({
    ...userData,
    calculatedAge: age,
    paycheckGross: userData.annualSalary / 26
  });
});

// GET current contribution settings
app.get('/api/contribution', (req, res) => {
  res.json(userData.contribution);
});

// PUT update contribution settings
app.put('/api/contribution', (req, res) => {
  const { type, value } = req.body;
  
  // Validation
  if (!type || !['percentage', 'fixed'].includes(type)) {
    return res.status(400).json({ error: 'Invalid contribution type. Must be "percentage" or "fixed".' });
  }
  
  if (typeof value !== 'number' || value < 0) {
    return res.status(400).json({ error: 'Invalid contribution value. Must be a non-negative number.' });
  }
  
  // IRS 401(k) limit for 2024 is $23,000 for under 50
  const maxAnnualContribution = 23000;
  const paycheckGross = userData.annualSalary / 26;
  
  if (type === 'percentage') {
    if (value > 100) {
      return res.status(400).json({ error: 'Percentage cannot exceed 100%.' });
    }
    const annualContribution = (value / 100) * userData.annualSalary;
    if (annualContribution > maxAnnualContribution) {
      return res.status(400).json({ 
        error: `Annual contribution would exceed IRS limit of $${maxAnnualContribution.toLocaleString()}.`,
        maxAllowedPercent: ((maxAnnualContribution / userData.annualSalary) * 100).toFixed(1)
      });
    }
  } else {
    const annualContribution = value * 26;
    if (annualContribution > maxAnnualContribution) {
      return res.status(400).json({ 
        error: `Annual contribution would exceed IRS limit of $${maxAnnualContribution.toLocaleString()}.`,
        maxAllowedAmount: (maxAnnualContribution / 26).toFixed(2)
      });
    }
    if (value > paycheckGross) {
      return res.status(400).json({ error: 'Contribution cannot exceed paycheck amount.' });
    }
  }
  
  userData.contribution = {
    type,
    value,
    lastUpdated: new Date().toISOString()
  };
  
  res.json({ 
    message: 'Contribution updated successfully',
    contribution: userData.contribution
  });
});

// GET retirement projection
app.get('/api/projection', (req, res) => {
  const { contributionPercent } = req.query;
  const percent = parseFloat(contributionPercent) || userData.contribution.value;
  
  const age = Math.floor((new Date() - new Date(userData.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
  const yearsToRetirement = 65 - age;
  const currentBalance = userData.ytdData.totalBalance;
  
  // Calculate annual contribution (employee + employer match)
  const annualEmployeeContrib = (percent / 100) * userData.annualSalary;
  const matchedPercent = Math.min(percent, userData.employerMatch.maxMatchPercent);
  const annualEmployerContrib = (matchedPercent / 100) * userData.annualSalary * (userData.employerMatch.matchPercent / 100);
  const totalAnnualContrib = annualEmployeeContrib + annualEmployerContrib;
  
  // Project with 7% average annual return
  const annualReturn = 0.07;
  let projectedBalance = currentBalance;
  const yearlyProjections = [];
  
  for (let year = 0; year <= yearsToRetirement; year++) {
    yearlyProjections.push({
      age: age + year,
      balance: Math.round(projectedBalance)
    });
    projectedBalance = (projectedBalance + totalAnnualContrib) * (1 + annualReturn);
  }
  
  res.json({
    currentAge: age,
    retirementAge: 65,
    yearsToRetirement,
    currentBalance,
    annualEmployeeContribution: annualEmployeeContrib,
    annualEmployerContribution: annualEmployerContrib,
    projectedBalanceAtRetirement: Math.round(projectedBalance),
    assumedAnnualReturn: '7%',
    yearlyProjections
  });
});

// GET YTD summary
app.get('/api/ytd', (req, res) => {
  res.json(userData.ytdData);
});

app.listen(PORT, () => {
  console.log(`401(k) API server running on http://localhost:${PORT}`);
});