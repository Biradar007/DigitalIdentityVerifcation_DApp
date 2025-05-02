import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Web3 from 'web3';
import contractData from './contract.json';
import AuthPage from './components/AuthPage';
import ApplicantPortal from './components/ApplicantPortal';
import EmployerPortal from './components/EmployerPortal';
import InstitutionPortal from './components/InstitutionPortal';
import AdminPortal from './components/AdminPortal';

const App = () => {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  const loadBlockchainData = async () => {
    try {
      let web3Instance;
      if (window.ethereum) {
        web3Instance = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } else if (window.web3) {
        web3Instance = new Web3(window.web3.currentProvider);
      } else {
        alert('Non-Ethereum browser detected. Please install MetaMask!');
        return;
      }

      setWeb3(web3Instance);

      const accountsList = await web3Instance.eth.getAccounts();
      setAccounts(accountsList);

      const contractInstance = await initContract(web3Instance);
      setContract(contractInstance);
    } catch (error) {
      console.error('Error initializing blockchain data:', error.message);
      alert('Error initializing blockchain data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initContract = async (web3Instance) => {
    try {
      const networkId = await web3Instance.eth.net.getId();
      const deployedNetwork = contractData.networks[networkId];
      
      if (!deployedNetwork) {
        throw new Error(`Contract not deployed on network ${networkId}`);
      }

      const instance = new web3Instance.eth.Contract(
        contractData.abi,
        deployedNetwork.address
      );
      
      console.log('Contract initialized:', {
        address: deployedNetwork.address,
        networkId,
        methods: Object.keys(instance.methods)
      });
      
      return instance;
    } catch (error) {
      console.error('Contract initialization error:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setAccounts([]);
    setContract(null);
    alert('You have been logged out.');
  };

  const handleAccountChange = (accounts) => {
    if (accounts.length === 0) {
      alert('Please connect to MetaMask.');
    } else {
      setAccounts(accounts);
    }
  };

  const handleNetworkChange = () => {
    window.location.reload();
  };

  useEffect(() => {
    loadBlockchainData();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountChange);
      window.ethereum.on('chainChanged', handleNetworkChange);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountChange);
        window.ethereum.removeListener('chainChanged', handleNetworkChange);
      }
    };
  }, []);

  if (loading) {
    return (
      <div>
        <p>Loading Blockchain Data...</p>
        <div className="spinner"></div> {/* You can add a spinner here */}
      </div>
    );
  }

  if (!web3 || !contract) {
    return (
      <div>
        <p>
          Error connecting to blockchain. Please ensure MetaMask is connected,
          and the contract is deployed to the correct network.
        </p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <AuthPage
              setUserRole={setUserRole}
              contract={contract}
              accounts={accounts}
              web3={web3}
            />
          }
        />
        <Route
          path="/applicant"
          element={
            userRole === 'applicant' ? (
              <ApplicantPortal
                contract={contract}
                accounts={accounts}
                web3={web3}
                handleLogout={handleLogout}
              />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/employer"
          element={
            userRole === 'employer' ? (
              <EmployerPortal
                contract={contract}
                accounts={accounts}
                web3={web3}
                handleLogout={handleLogout}
              />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/institution"
          element={
            userRole === 'institution' ? (
              <InstitutionPortal
                contract={contract}
                accounts={accounts}
                web3={web3}
                handleLogout={handleLogout}
              />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/admin"
          element={
            userRole === 'admin' ? (
              <AdminPortal
                contract={contract}
                accounts={accounts}
                web3={web3}
                handleLogout={handleLogout}
              />
            ) : (
              <Navigate to="/admin" />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
