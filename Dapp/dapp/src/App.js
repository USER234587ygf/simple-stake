import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
import { Web3Modal } from '@web3modal/react';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { arbitrum, mainnet, polygon } from 'wagmi/chains';
import { Web3Button } from '@web3modal/react';

const chains = [arbitrum, mainnet, polygon];
const projectId = '17c0a22e21ae2e2787cb76453c36b269';
const contractAddress = '0x658836315be349a2DfE42dE848F46bAD3aE0836f'; // Replace with the address of your deployed staking contract

const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, version: 2, chains }),
  publicClient
});

const ethereumClient = new EthereumClient(wagmiConfig, chains);

const contractABI = [
  {
    "inputs": [],
    "name": "stake",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "unstake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "balances",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "getBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalStakedAmount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalStaked",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];


const YourComponent = () => {
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [connectedAddress, setConnectedAddress] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [totalStakedAmount, setTotalStakedAmount] = useState(0);
  const [userStakedAmount, setUserStakedAmount] = useState(0);

  useEffect(() => {
    if (contract && connectedAddress) {
      getTotalStakedAmount();
      getUserStakedAmount(connectedAddress);
    }
  }, [contract, connectedAddress]);

  useEffect(() => {
    connectToProvider();
  }, []); // Empty dependency array

  async function connectToProvider() {
    if (window.ethereum) {
      try {
        await window.ethereum.enable();
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);
        const address = await signer.getAddress();
        if (!address) {
          console.error('No account address available');
          return;
        }
        setConnectedAddress(address); // get the connected account address
        setContract(contract);
        console.log('Connected address:', address);

        // Now you can call the contract methods
        if (contract) {
          console.log('Contract:', contract);
          await getTotalStakedAmount();
          await getUserStakedAmount(address);
        }
      } catch (error) {
        console.error('Error connecting to provider:', error);
      }
    }
  }

  const connectWallet = async () => {
    console.log('Connecting wallet...');
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await provider.listAccounts();
        setConnectedAddress(accounts[0]);
        console.log('Connected address:', accounts[0]);
        await getTotalStakedAmount();
        await getUserStakedAmount(accounts[0]);
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Error connecting wallet: ' + error.message);
      }
    } else {
      console.error('MetaMask not detected.');
      alert('MetaMask not detected.');
    }
  };

  async function getTotalStakedAmount() {
    if (!contract) {
      console.error('Contract not yet ready');
      return;
    }
    try {
      const totalStaked = await contract.getTotalStakedAmount();
      console.log('Total staked amount:', totalStaked);
      // Handle the retrieved value as needed
    } catch (error) {
      console.error('Error getting total staked amount:', error);
    }
  }
  
  async function getUserStakedAmount(address) {
    if (!contract) {
      console.error('Contract not yet ready');
      return;
    }
    if (!address) {
      console.error('No address provided');
      return;
    }
    try {
      const userBalance = await contract.getBalance(address);
      setUserStakedAmount(ethers.utils.formatEther(userBalance));
      console.log('User staked amount:', ethers.utils.formatEther(userBalance));
    } catch (error) {
      console.error('Error getting user staked amount:', error);
    }
  }
  

  const handleStakeAmountChange = (event) => {
    setStakeAmount(event.target.value);
  };

  const handleUnstakeAmountChange = (event) => {
    setUnstakeAmount(event.target.value);
  };

  const stakeTokens = async () => {
    console.log('Staking tokens...');
    if (!contract) {
      console.error('Contract not initialized.');
      return;
    }

    if (!connectedAddress) {
      console.error('Wallet not connected.');
      return;
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const transaction = await contract.stake({ value: ethers.utils.parseEther(stakeAmount) });
      await transaction.wait();
      setStakeAmount('');
      await getTotalStakedAmount();
      await getUserStakedAmount(connectedAddress);
      console.log('Tokens staked!');
      alert('Tokens staked successfully!');
    } catch (error) {
      console.error('Error staking tokens:', error);
      alert('Error staking tokens: ' + error.message);
    }
  };

  const unstakeTokens = async () => {
    console.log('Unstaking tokens...');
    if (!contract) {
      console.error('Contract not initialized.');
      return;
    }

    if (!connectedAddress) {
      console.error('Wallet not connected.');
      return;
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const transaction = await contract.unstake(ethers.utils.parseEther(unstakeAmount));
      await transaction.wait();
      setUnstakeAmount('');
      await getTotalStakedAmount();
      await getUserStakedAmount(connectedAddress);
      console.log('Tokens unstaked!');
      alert('Tokens unstaked successfully!');
    } catch (error) {
      console.error('Error unstaking tokens:', error);
      alert('Error unstaking tokens: ' + error.message);
    }
  };

  return (
    <div>
      <h1>My DApp</h1>
      <WagmiConfig config={wagmiConfig} />
      <Web3Button onClick={connectWallet} projectId={projectId} ethereumClient={ethereumClient} />
      <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
      <h2>Total Amount Staked In Contract: {totalStakedAmount.toFixed(5)}</h2>
      <h2>Total Amount Connected User Has Staked: {userStakedAmount.toFixed(5)}</h2>
      <h2>Stake Tokens</h2>
      <input type="text" value={stakeAmount} onChange={handleStakeAmountChange} placeholder="Enter stake amount" />
      <button onClick={stakeTokens}>Stake Tokens</button>
      <h2>Unstake Tokens</h2>
      <input type="text" value={unstakeAmount} onChange={handleUnstakeAmountChange} placeholder="Enter unstake amount" />
      <button onClick={unstakeTokens}>Unstake Tokens</button>
    </div>
  );
};

export default YourComponent;
