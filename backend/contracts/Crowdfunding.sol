// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Crowdfunding - milestone-based crowdfunding platform with contributor voting
/// @notice Funds are escrowed in this contract and released to creators only in
///         milestone-sized chunks after contributor approval. No admin address
///         can withdraw escrowed funds directly.
contract Crowdfunding is ReentrancyGuard {
    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------

    enum CampaignStatus {
        Active,
        Successful,
        Failed,
        Cancelled,
        Completed
    }

    enum MilestoneStatus {
        Pending, // not yet submitted by creator
        Submitted, // submitted, voting window open
        Approved, // voting passed threshold, funds releasable/released
        Rejected // voting failed - campaign can be marked failed by creator/contributors
    }

    struct Milestone {
        uint256 amount; // amount allocated to this milestone (wei)
        MilestoneStatus status;
        uint256 votingDeadline; // 0 until submitted
        uint256 votesFor; // weighted by contribution amount
        uint256 votesAgainst;
        bool released;
        string proofURI; // off-chain proof pointer (IPFS/Cloudinary), informational only
    }

    struct Campaign {
        address payable creator;
        uint256 goal;
        uint256 deadline;
        uint256 totalRaised;
        uint256 totalReleased;
        CampaignStatus status;
        uint256 milestoneCount;
        uint256 currentMilestone; // index of the next milestone to be submitted/approved
        bool goalFinalized; // whether success/failure has been determined post-deadline
    }

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant APPROVAL_THRESHOLD_BPS = 5000; // 50.00% of eligible voting power, in basis points

    uint256 public campaignCount;

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => Milestone[]) public campaignMilestones;

    // campaignId => contributor => amount contributed
    mapping(uint256 => mapping(address => uint256)) public contributions;
    // campaignId => list of contributor addresses (for iteration / refunds bookkeeping)
    mapping(uint256 => address[]) public campaignContributors;
    mapping(uint256 => mapping(address => bool)) private isKnownContributor;

    // campaignId => milestoneId => voter => voted
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasVoted;

    // campaignId => contributor => amount already refunded (prevents double refund)
    mapping(uint256 => mapping(address => bool)) public refundClaimed;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 goal,
        uint256 deadline,
        uint256[] milestoneAmounts
    );

    event ContributionReceived(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 amount,
        uint256 totalRaised
    );

    event MilestoneSubmitted(
        uint256 indexed campaignId,
        uint256 indexed milestoneId,
        string proofURI,
        uint256 votingDeadline
    );

    event VoteCast(
        uint256 indexed campaignId,
        uint256 indexed milestoneId,
        address indexed voter,
        bool support,
        uint256 weight
    );

    event MilestoneApproved(uint256 indexed campaignId, uint256 indexed milestoneId);
    event MilestoneRejected(uint256 indexed campaignId, uint256 indexed milestoneId);

    event FundsReleased(
        uint256 indexed campaignId,
        uint256 indexed milestoneId,
        address indexed creator,
        uint256 amount
    );

    event CampaignCompleted(uint256 indexed campaignId);
    event CampaignStatusChanged(uint256 indexed campaignId, CampaignStatus status);
    event RefundClaimed(uint256 indexed campaignId, address indexed contributor, uint256 amount);

    // ---------------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------------

    modifier campaignExists(uint256 campaignId) {
        require(campaignId < campaignCount, "Campaign does not exist");
        _;
    }

    modifier onlyCreator(uint256 campaignId) {
        require(msg.sender == campaigns[campaignId].creator, "Not campaign creator");
        _;
    }

    // ---------------------------------------------------------------------
    // Campaign creation
    // ---------------------------------------------------------------------

    /// @notice Creates a new campaign. Title/description are kept off-chain; only
    ///         financially-relevant data lives on-chain.
    function createCampaign(
        uint256 goal,
        uint256 deadline,
        uint256[] calldata milestoneAmounts
    ) external returns (uint256 campaignId) {
        require(goal > 0, "Goal must be > 0");
        require(deadline > block.timestamp, "Deadline must be in the future");
        require(milestoneAmounts.length > 0, "Need at least one milestone");

        uint256 sum;
        for (uint256 i = 0; i < milestoneAmounts.length; i++) {
            require(milestoneAmounts[i] > 0, "Milestone amount must be > 0");
            sum += milestoneAmounts[i];
        }
        require(sum == goal, "Milestone amounts must sum to goal");

        campaignId = campaignCount++;

        Campaign storage c = campaigns[campaignId];
        c.creator = payable(msg.sender);
        c.goal = goal;
        c.deadline = deadline;
        c.status = CampaignStatus.Active;
        c.milestoneCount = milestoneAmounts.length;

        for (uint256 i = 0; i < milestoneAmounts.length; i++) {
            campaignMilestones[campaignId].push(
                Milestone({
                    amount: milestoneAmounts[i],
                    status: MilestoneStatus.Pending,
                    votingDeadline: 0,
                    votesFor: 0,
                    votesAgainst: 0,
                    released: false,
                    proofURI: ""
                })
            );
        }

        emit CampaignCreated(campaignId, msg.sender, goal, deadline, milestoneAmounts);
    }

    // ---------------------------------------------------------------------
    // Contribution
    // ---------------------------------------------------------------------

    function contribute(uint256 campaignId) external payable campaignExists(campaignId) {
        Campaign storage c = campaigns[campaignId];
        require(c.status == CampaignStatus.Active, "Campaign not active");
        require(block.timestamp < c.deadline, "Deadline passed");
        require(msg.value > 0, "Contribution must be > 0");

        if (!isKnownContributor[campaignId][msg.sender]) {
            isKnownContributor[campaignId][msg.sender] = true;
            campaignContributors[campaignId].push(msg.sender);
        }

        contributions[campaignId][msg.sender] += msg.value;
        c.totalRaised += msg.value;

        emit ContributionReceived(campaignId, msg.sender, msg.value, c.totalRaised);
    }

    // ---------------------------------------------------------------------
    // Milestone lifecycle: submission -> voting -> approval -> release
    // ---------------------------------------------------------------------

    function submitMilestone(uint256 campaignId, uint256 milestoneId, string calldata proofURI)
        external
        campaignExists(campaignId)
        onlyCreator(campaignId)
    {
        Campaign storage c = campaigns[campaignId];
        require(c.status == CampaignStatus.Active, "Campaign not active");
        require(milestoneId == c.currentMilestone, "Must submit milestones in order");
        require(milestoneId < c.milestoneCount, "Invalid milestone");

        Milestone storage m = campaignMilestones[campaignId][milestoneId];
        require(m.status == MilestoneStatus.Pending, "Milestone already submitted");

        // First milestone requires the funding goal to have been reached.
        if (milestoneId == 0) {
            require(c.totalRaised >= c.goal, "Funding goal not reached");
        }

        m.status = MilestoneStatus.Submitted;
        m.votingDeadline = block.timestamp + VOTING_PERIOD;
        m.proofURI = proofURI;

        emit MilestoneSubmitted(campaignId, milestoneId, proofURI, m.votingDeadline);
    }

    function voteOnMilestone(uint256 campaignId, uint256 milestoneId, bool support)
        external
        campaignExists(campaignId)
    {
        Milestone storage m = campaignMilestones[campaignId][milestoneId];
        require(m.status == MilestoneStatus.Submitted, "Milestone not open for voting");
        require(block.timestamp <= m.votingDeadline, "Voting period ended");
        require(!hasVoted[campaignId][milestoneId][msg.sender], "Already voted");

        uint256 weight = contributions[campaignId][msg.sender];
        require(weight > 0, "Not an eligible contributor");

        hasVoted[campaignId][milestoneId][msg.sender] = true;

        if (support) {
            m.votesFor += weight;
        } else {
            m.votesAgainst += weight;
        }

        emit VoteCast(campaignId, milestoneId, msg.sender, support, weight);
    }

    /// @notice Finalizes voting on a milestone once the voting deadline has passed.
    ///         Anyone can call this to move state forward (no funds move here).
    function finalizeMilestoneVote(uint256 campaignId, uint256 milestoneId)
        external
        campaignExists(campaignId)
    {
        Campaign storage c = campaigns[campaignId];
        Milestone storage m = campaignMilestones[campaignId][milestoneId];
        require(m.status == MilestoneStatus.Submitted, "Milestone not open for voting");
        require(block.timestamp > m.votingDeadline, "Voting still open");

        uint256 totalVotes = m.votesFor + m.votesAgainst;
        bool approved = false;

        if (totalVotes > 0) {
            approved = (m.votesFor * 10000) / totalVotes >= APPROVAL_THRESHOLD_BPS;
        }

        if (approved) {
            m.status = MilestoneStatus.Approved;
            emit MilestoneApproved(campaignId, milestoneId);
        } else {
            m.status = MilestoneStatus.Rejected;
            c.status = CampaignStatus.Failed;
            emit MilestoneRejected(campaignId, milestoneId);
            emit CampaignStatusChanged(campaignId, CampaignStatus.Failed);
        }
    }

    /// @notice Releases the funds allocated to an approved milestone to the creator.
    ///         Only the amount allocated to this milestone moves - never the full balance.
    function releaseMilestone(uint256 campaignId, uint256 milestoneId)
        external
        nonReentrant
        campaignExists(campaignId)
    {
        Campaign storage c = campaigns[campaignId];
        Milestone storage m = campaignMilestones[campaignId][milestoneId];

        require(m.status == MilestoneStatus.Approved, "Milestone not approved");
        require(!m.released, "Already released");
        require(milestoneId == c.currentMilestone, "Milestones must release in order");

        // Effects before interaction (checks-effects-interactions)
        m.released = true;
        c.totalReleased += m.amount;
        c.currentMilestone += 1;

        bool isLastMilestone = c.currentMilestone == c.milestoneCount;
        if (isLastMilestone) {
            c.status = CampaignStatus.Completed;
        }

        uint256 amountToSend = m.amount;
        address payable creator = c.creator;

        emit FundsReleased(campaignId, milestoneId, creator, amountToSend);
        if (isLastMilestone) {
            emit CampaignCompleted(campaignId);
        }

        // Interaction last
        (bool ok, ) = creator.call{value: amountToSend}("");
        require(ok, "Transfer to creator failed");
    }

    // ---------------------------------------------------------------------
    // Refunds
    // ---------------------------------------------------------------------

    /// @notice Marks a campaign as failed if the deadline passed without reaching the goal.
    ///         Anyone may call this; it only reads on-chain state.
    function finalizeFundingResult(uint256 campaignId) external campaignExists(campaignId) {
        Campaign storage c = campaigns[campaignId];
        require(c.status == CampaignStatus.Active, "Campaign not active");
        require(block.timestamp >= c.deadline, "Deadline not reached");
        require(!c.goalFinalized, "Already finalized");

        c.goalFinalized = true;

        if (c.totalRaised < c.goal) {
            c.status = CampaignStatus.Failed;
            emit CampaignStatusChanged(campaignId, CampaignStatus.Failed);
        } else {
            c.status = CampaignStatus.Successful;
            emit CampaignStatusChanged(campaignId, CampaignStatus.Successful);
        }
    }

    /// @notice Creator may cancel a campaign before any milestone has been approved/released.
    function cancelCampaign(uint256 campaignId)
        external
        campaignExists(campaignId)
        onlyCreator(campaignId)
    {
        Campaign storage c = campaigns[campaignId];
        require(c.status == CampaignStatus.Active, "Campaign not active");
        require(c.totalReleased == 0, "Funds already released");

        c.status = CampaignStatus.Cancelled;
        emit CampaignStatusChanged(campaignId, CampaignStatus.Cancelled);
    }

    /// @notice Contributors claim a refund of their unspent contribution when a campaign
    ///         has failed or been cancelled. Only the portion of the pool that was never
    ///         released to the creator is refundable, split pro-rata by contribution.
    function claimRefund(uint256 campaignId) external nonReentrant campaignExists(campaignId) {
        Campaign storage c = campaigns[campaignId];
        require(
            c.status == CampaignStatus.Failed || c.status == CampaignStatus.Cancelled,
            "Campaign not refundable"
        );
        require(!refundClaimed[campaignId][msg.sender], "Refund already claimed");

        uint256 contributed = contributions[campaignId][msg.sender];
        require(contributed > 0, "No contribution found");

        uint256 remainingPool = c.totalRaised - c.totalReleased;
        require(remainingPool > 0, "Nothing left to refund");

        // Pro-rata share of whatever remains in escrow.
        uint256 refundAmount = (contributed * remainingPool) / c.totalRaised;

        refundClaimed[campaignId][msg.sender] = true;

        emit RefundClaimed(campaignId, msg.sender, refundAmount);

        (bool ok, ) = payable(msg.sender).call{value: refundAmount}("");
        require(ok, "Refund transfer failed");
    }

    // ---------------------------------------------------------------------
    // View helpers
    // ---------------------------------------------------------------------

    function getMilestone(uint256 campaignId, uint256 milestoneId)
        external
        view
        returns (Milestone memory)
    {
        return campaignMilestones[campaignId][milestoneId];
    }

    function getMilestoneCount(uint256 campaignId) external view returns (uint256) {
        return campaignMilestones[campaignId].length;
    }

    function getContribution(uint256 campaignId, address contributor)
        external
        view
        returns (uint256)
    {
        return contributions[campaignId][contributor];
    }

    function getContributorCount(uint256 campaignId) external view returns (uint256) {
        return campaignContributors[campaignId].length;
    }

    function getCampaign(uint256 campaignId) external view returns (Campaign memory) {
        return campaigns[campaignId];
    }
}
