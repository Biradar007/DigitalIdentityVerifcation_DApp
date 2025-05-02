require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const Web3 = require('web3').default; // Corrected import
const contractData = require('./contract.json');

const app = express();
app.use(express.json());

const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/digital_identity_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
connectDB();

// Web3 setup
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));// Ganache or local node
const contractAddress = contractData.networks['5777']?.address;
const contractABI = contractData.abi;

if (!contractAddress) {
  console.error('Contract address not found for network ID 5777');
  process.exit(1);
}
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Load User model
const User = require('./models/User');

// API for user registration
app.post('/api/register', async (req, res) => {
  const { username, password, role, address } = req.body;

  // Validate required fields
  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === 'applicant') {
      // Register applicant in MongoDB
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists.' });
      }
      const user = new User({ username, password: hashedPassword, role });
      await user.save();
      return res.status(201).json({ message: 'Applicant registered successfully.' });
    } else if (role === 'employer' || role === 'institution') {
      // Ethereum address is mandatory for employer and institution
      if (!address || !web3.utils.isAddress(address)) {
        return res.status(400).json({ message: 'Invalid Ethereum address.' });
      }

      const accounts = await web3.eth.getAccounts();
      const ownerAccount = accounts[0];

      try {
        // Blockchain registration
        if (role === 'employer') {
          console.log(`Registering employer ${address} on blockchain...`);
          await contract.methods.registerEmployer(address).send({
            from: ownerAccount,
            gas: 500000,
          });
          console.log(`Employer ${address} successfully registered on blockchain.`);
        } else if (role === 'institution') {
          console.log(`Registering institution ${address} with name ${username} on blockchain...`);
          await contract.methods.registerInstitution(address, username).send({
            from: ownerAccount,
            gas: 500000,
          });
          console.log(`Institution ${address} successfully registered on blockchain.`);
        }

        // Insert into MongoDB after successful blockchain registration
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return res.status(400).json({ message: 'Username already exists.' });
        }
        const user = new User({ username, password: hashedPassword, role, address });
        await user.save();
        return res.status(201).json({ message: `${role} registered successfully.` });
      } catch (contractError) {
        console.error(`Blockchain registration error for ${role}:`, contractError);
        return res.status(500).json({
          message: `${role.charAt(0).toUpperCase() + role.slice(1)} registration failed on blockchain.`,
        });
      }
    } else {
      return res.status(400).json({ message: 'Invalid role specified.' });
    }
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// API for fetching employers
app.get('/api/employers', async (req, res) => {
  try {
    const employers = await User.find({ role: 'employer' }).select('username');
    res.status(200).json({ employers: employers.map(user => ({ username: user.username })) });
  } catch (error) {
    console.error('Error fetching employers:', error);
    res.status(500).json({ message: 'Failed to fetch employers.' });
  }
});

// API for fetching institutions
app.get('/api/institutions', async (req, res) => {
  try {
    const institutions = await User.find({ role: 'institution' }).select('username');
    res.status(200).json({ institutions: institutions.map(user => user.username) });
  } catch (error) {
    console.error('Error fetching institutions:', error);
    res.status(500).json({ message: 'Failed to fetch institutions.' });
  }
});

// API for user login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    res.json({
      message: 'Login successful.',
      role: user.role,
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));