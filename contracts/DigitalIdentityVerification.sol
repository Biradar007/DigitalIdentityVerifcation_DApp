// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DigitalIdentityVerification is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    struct Resume {
        string applicantName;
        string resumeHash;
        string employerName;
    }

    struct InstitutionRequest {
        uint256 tokenId;
        string institutionName;
        bool requested;
    }

    mapping(address => Resume) public resumes;
    mapping(address => bool) public employers;

    // Public mappings for institutions
    mapping(address => bool) public institutions;
    mapping(address => string) public institutionNames;

    mapping(uint256 => InstitutionRequest) public institutionRequests;
    mapping(uint256 => bool) public employerVerified;
    mapping(uint256 => bool) public institutionVerified;

    uint256 public tokenCounter;

    event EmployerRegistered(address indexed employer);
    event InstitutionRegistered(address indexed institution);
    event ResumeUploaded(address indexed applicant, string resumeHash);
    event NFTMinted(address indexed applicant, uint256 tokenId, string employerName);
    event InstitutionVerificationRequested(uint256 tokenId, string institutionName, address indexed employer, string employerName);
    event ResumeVerifiedByEmployer(uint256 tokenId, address indexed employer);
    event ResumeVerifiedByInstitution(uint256 tokenId, address indexed institution);
    event InstitutionApprovalUpdated(uint256 tokenId, address institution);
    event EmployerApprovalUpdated(uint256 tokenId, address employer);

    constructor(address initialOwner) ERC721("Digital Identity Verification NFT", "DIVNFT") Ownable(initialOwner) {
        tokenCounter = 0;
    }

    // Register an employer
    function registerEmployer(address employer) public onlyOwner {
        require(employer != address(0), "Invalid employer address");
        employers[employer] = true;
        emit EmployerRegistered(employer);
    }

    // Function to register institution
    function registerInstitution(address institution, string memory name) public onlyOwner {
        require(institution != address(0), "Invalid institution address");
        require(bytes(name).length > 0, "Institution name is required");
        institutions[institution] = true;
        institutionNames[institution] = name;
        emit InstitutionRegistered(institution);
    }

    // Function to get institution name
    function getInstitutionName(address institution) public view returns (string memory) {
        require(institutions[institution], "Institution not registered");
        return institutionNames[institution];
    }

    // Upload a resume
    function uploadResume(
        string memory applicantName,
        string memory hash,
        string memory employerName
    ) public {
        require(bytes(applicantName).length > 0, "Applicant name is required");
        require(bytes(hash).length > 0, "Resume hash is required");
        require(bytes(employerName).length > 0, "Employer name is required");

        resumes[msg.sender] = Resume(applicantName, hash, employerName);
        emit ResumeUploaded(msg.sender, hash);

        uint256 tokenId = tokenCounter;
        _mint(msg.sender, tokenId);
        emit NFTMinted(msg.sender, tokenId, employerName);
        tokenCounter++;
    }

    // Request institution verification
    function requestVerificationByInstitution(uint256 tokenId, string memory institutionName, string memory employerName) public {
        require(employers[msg.sender], "Caller is not a registered employer");
        require(_ownerOf(tokenId) != address(0), "Token ID does not exist");
        require(bytes(institutionName).length > 0, "Institution name is required");
        require(bytes(employerName).length > 0, "Employer name is required");

        institutionRequests[tokenId] = InstitutionRequest({
            tokenId: tokenId,
            institutionName: institutionName,
            requested: true
        });

        emit InstitutionVerificationRequested(tokenId, institutionName, msg.sender, employerName);
    }

    // Verify a resume by an institution
    function verifyByInstitution(uint256 tokenId) public {
        require(_ownerOf(tokenId) != address(0), "Invalid tokenId");
        require(institutions[msg.sender], "Caller is not a registered institution");
        require(institutionRequests[tokenId].requested, "No verification request exists");
        require(bytes(institutionRequests[tokenId].institutionName).length > 0, "Invalid institution name");

        institutionVerified[tokenId] = true;
        emit ResumeVerifiedByInstitution(tokenId, msg.sender);
        emit InstitutionApprovalUpdated(tokenId, msg.sender);
    }

    // Verify a resume by an employer
    function verifyByEmployer(uint256 tokenId) public {
        require(employers[msg.sender], "Caller is not a registered employer");
        require(_ownerOf(tokenId) != address(0), "Invalid tokenId");
        require(institutionVerified[tokenId], "Resume must be verified by an institution first");

        employerVerified[tokenId] = true;
        emit ResumeVerifiedByEmployer(tokenId, msg.sender);
        emit EmployerApprovalUpdated(tokenId, msg.sender);
    }

    // Get resume details by address
    function getResume(address applicant)
        public
        view
        returns (string memory, string memory, string memory)
    {
        Resume memory resume = resumes[applicant];
        return (resume.applicantName, resume.resumeHash, resume.employerName);
    }

    // Check if resume is verified by employer
    function isVerifiedByEmployer(uint256 tokenId) public view returns (bool) {
        return employerVerified[tokenId];
    }

    // Check if resume is verified by institution
    function isVerifiedByInstitution(uint256 tokenId) public view returns (bool) {
        return institutionVerified[tokenId];
    }

    // Get institution verification request details for a token ID
    function getInstitutionRequest(uint256 tokenId) public view returns (string memory, bool) {
        InstitutionRequest memory request = institutionRequests[tokenId];
        return (request.institutionName, request.requested);
    }

    // Override required functions
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}

