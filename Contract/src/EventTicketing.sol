// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title EventTicketing
/// @notice Admin-approved creators create events. Attendees claim soulbound tickets (free or paid).
/// @dev Event details live off-chain; metadataURI points to them.
///      - Creators can only withdraw proceeds after the event starts.
///      - Creators can cancel any event before it starts; buyers then refund their own tickets.
///      - Check-in is only possible inside a time window around the event.
contract EventTicketing is ERC721URIStorage, AccessControl, ReentrancyGuard {
    bytes32 public constant EVENT_CREATOR_ROLE = keccak256("EVENT_CREATOR_ROLE");

    /// @notice Check-in opens this long before the event starts.
    uint64 public constant CHECK_IN_OPENS_BEFORE = 2 hours;

    error ZeroAddress();
    error EmptyMetadataURI();
    error InvalidTicketLimit();
    error InvalidStartTime();
    error InvalidEndTime();
    error IncorrectPayment(uint256 expected, uint256 received);
    error EventNotFound(uint256 eventId);
    error EventCancelled(uint256 eventId);
    error EventNotCancelled(uint256 eventId);
    error EventHasStarted(uint256 eventId);
    error EventNotStarted(uint256 eventId);
    error SoldOut(uint256 eventId);
    error AlreadyClaimed(uint256 eventId, address attendee);
    error NoProceeds(uint256 eventId);
    error NotEventCreator(uint256 eventId, address caller);
    error NotTicketOwner(uint256 ticketId, address caller);
    error TicketNotForEvent(uint256 ticketId, uint256 eventId);
    error TicketAlreadyCheckedIn(uint256 ticketId);
    error CheckInClosed(uint256 eventId);
    error EthTransferFailed();
    error SoulboundTransfer();

    struct EventInfo {
        address creator;
        uint64 startsAt;
        uint32 ticketLimit;
        uint32 ticketsIssued;
        uint96 ticketPrice;
        uint64 endsAt;
        bool cancelled;
        string metadataURI;
    }

    uint256 public nextEventId = 1;
    uint256 public nextTicketId = 1;

    mapping(uint256 eventId => EventInfo) private _events;
    mapping(uint256 ticketId => uint256 eventId) public ticketEvent;
    /// @notice The attendee's position for that event (1st ticket sold = 1, and so on).
    mapping(uint256 ticketId => uint32) public ticketNumber;
    mapping(uint256 ticketId => bool) public checkedIn;
    mapping(uint256 eventId => mapping(address attendee => bool)) public hasClaimed;
    mapping(uint256 eventId => uint256) public pendingProceeds;

    event EventCreated(
        uint256 indexed eventId,
        address indexed creator,
        uint64 startsAt,
        uint64 endsAt,
        uint32 ticketLimit,
        uint96 ticketPrice,
        string metadataURI
    );
    event EventCancelledByCreator(uint256 indexed eventId);
    event TicketClaimed(uint256 indexed eventId, uint256 indexed ticketId, address indexed attendee);
    event TicketCheckedIn(uint256 indexed eventId, uint256 indexed ticketId, address indexed attendee);
    event TicketRefunded(uint256 indexed eventId, uint256 indexed ticketId, address indexed attendee, uint256 amount);
    event ProceedsWithdrawn(uint256 indexed eventId, address indexed creator, uint256 amount);

    constructor(address admin) ERC721("Event Ticket", "ETIX") {
        if (admin == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // ---------------------------------------------------------------------
    // Creator actions
    // ---------------------------------------------------------------------

    /// @notice Create an event. ticketPrice is in wei; use 0 for a free event.
    function createEvent(
        uint64 startsAt,
        uint64 endsAt,
        uint32 ticketLimit,
        uint96 ticketPrice,
        string calldata metadataURI
    ) external onlyRole(EVENT_CREATOR_ROLE) returns (uint256 eventId) {
        if (ticketLimit == 0) revert InvalidTicketLimit();
        if (startsAt <= block.timestamp) revert InvalidStartTime();
        if (endsAt <= startsAt) revert InvalidEndTime();
        if (bytes(metadataURI).length == 0) revert EmptyMetadataURI();

        eventId = nextEventId++;

        EventInfo storage e = _events[eventId];
        e.creator = msg.sender;
        e.startsAt = startsAt;
        e.endsAt = endsAt;
        e.ticketLimit = ticketLimit;
        e.ticketPrice = ticketPrice;
        e.metadataURI = metadataURI;

        emit EventCreated(eventId, msg.sender, startsAt, endsAt, ticketLimit, ticketPrice, metadataURI);
    }

    /// @notice Cancel an event before it starts. Buyers can then call refundTicket.
    function cancelEvent(uint256 eventId) external {
        EventInfo storage e = _events[eventId];
        if (e.creator == address(0)) revert EventNotFound(eventId);
        if (msg.sender != e.creator) revert NotEventCreator(eventId, msg.sender);
        if (e.cancelled) revert EventCancelled(eventId);
        if (block.timestamp >= e.startsAt) revert EventHasStarted(eventId);

        e.cancelled = true;
        emit EventCancelledByCreator(eventId);
    }

    /// @notice Withdraw ticket payments. Only possible once the event has started and was not cancelled.
    function withdrawProceeds(uint256 eventId) external nonReentrant {
        EventInfo storage e = _events[eventId];
        if (e.creator == address(0)) revert EventNotFound(eventId);
        if (msg.sender != e.creator) revert NotEventCreator(eventId, msg.sender);
        if (e.cancelled) revert EventCancelled(eventId);
        if (block.timestamp < e.startsAt) revert EventNotStarted(eventId);

        uint256 amount = pendingProceeds[eventId];
        if (amount == 0) revert NoProceeds(eventId);
        pendingProceeds[eventId] = 0;

        (bool success,) = payable(msg.sender).call{value: amount}("");
        if (!success) revert EthTransferFailed();
        emit ProceedsWithdrawn(eventId, msg.sender, amount);
    }

    /// @notice Check in a ticket. Only this event's creator, and only inside the check-in window.
    function checkIn(uint256 eventId, uint256 ticketId) external {
        EventInfo storage e = _events[eventId];
        if (e.creator == address(0)) revert EventNotFound(eventId);
        if (msg.sender != e.creator) revert NotEventCreator(eventId, msg.sender);
        if (e.cancelled) revert EventCancelled(eventId);
        if (block.timestamp + CHECK_IN_OPENS_BEFORE < e.startsAt || block.timestamp > e.endsAt) {
            revert CheckInClosed(eventId);
        }
        if (ticketEvent[ticketId] != eventId) revert TicketNotForEvent(ticketId, eventId);
        if (checkedIn[ticketId]) revert TicketAlreadyCheckedIn(ticketId);

        address attendee = ownerOf(ticketId); // reverts if the ticket was refunded (burned)
        checkedIn[ticketId] = true;
        emit TicketCheckedIn(eventId, ticketId, attendee);
    }

    // ---------------------------------------------------------------------
    // Attendee actions
    // ---------------------------------------------------------------------

    /// @notice Buy or claim one ticket for the caller. Send the exact ticket price in wei.
    function claimTicket(uint256 eventId) external payable nonReentrant returns (uint256 ticketId) {
        EventInfo storage e = _events[eventId];
        if (e.creator == address(0)) revert EventNotFound(eventId);
        if (e.cancelled) revert EventCancelled(eventId);
        if (block.timestamp >= e.startsAt) revert EventHasStarted(eventId);
        if (e.ticketsIssued >= e.ticketLimit) revert SoldOut(eventId);
        if (hasClaimed[eventId][msg.sender]) revert AlreadyClaimed(eventId, msg.sender);
        if (msg.value != e.ticketPrice) revert IncorrectPayment(e.ticketPrice, msg.value);

        ticketId = nextTicketId++;
        e.ticketsIssued++;
        hasClaimed[eventId][msg.sender] = true;
        pendingProceeds[eventId] += msg.value;
        ticketEvent[ticketId] = eventId;
        ticketNumber[ticketId] = e.ticketsIssued;

        // _mint (not _safeMint) so smart-contract wallets without onERC721Received can still receive tickets.
        _mint(msg.sender, ticketId);
        _setTokenURI(ticketId, e.metadataURI);

        emit TicketClaimed(eventId, ticketId, msg.sender);
    }

    /// @notice Refund a ticket for a cancelled event. The ticket is burned and the price returned.
    function refundTicket(uint256 ticketId) external nonReentrant {
        uint256 eventId = ticketEvent[ticketId];
        EventInfo storage e = _events[eventId];
        if (!e.cancelled) revert EventNotCancelled(eventId);
        if (ownerOf(ticketId) != msg.sender) revert NotTicketOwner(ticketId, msg.sender);

        uint256 amount = e.ticketPrice;
        pendingProceeds[eventId] -= amount;
        _burn(ticketId);

        if (amount > 0) {
            (bool success,) = payable(msg.sender).call{value: amount}("");
            if (!success) revert EthTransferFailed();
        }
        emit TicketRefunded(eventId, ticketId, msg.sender, amount);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function getEvent(uint256 eventId) external view returns (EventInfo memory) {
        if (_events[eventId].creator == address(0)) revert EventNotFound(eventId);
        return _events[eventId];
    }

    // ---------------------------------------------------------------------
    // Soulbound
    // ---------------------------------------------------------------------

    /// @dev Minting and burning (refunds) are allowed. Moving a ticket between wallets is not.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        if (_ownerOf(tokenId) != address(0) && to != address(0)) revert SoulboundTransfer();
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
