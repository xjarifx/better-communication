# Specification 07: WebRTC & Video Calls Subsystem

This document specifies the calling architecture, WebRTC peer-to-peer 1:1 signaling sequences, and Daily.co multi-user group conference scaling.

---

## 1. Call Topology Overview

Better-Communication employs a cost-efficient, split-topology approach to audio/video streaming:

- **1:1 Direct Calling**: Uses peer-to-peer **WebRTC** connections. Streams audio and video data directly between browsers, eliminating server infrastructure costs.
- **Group Calling (3+ Members)**: Switches to a server-side selective forwarding unit (SFU) calling structure managed by **Daily.co**, ensuring smooth performance as member counts scale.

---

## 2. 1:1 Peer-to-Peer WebRTC Signaling Protocol

Direct connections between browsers require a signaling channel to negotiate connection paths and session attributes. This negotiation is mediated by our custom WebSocket server:

```
[Caller Client]                 [WebSocket Server]             [Callee Client]
       │                                 │                             │
       ├─ (1) Call Button Press ────────►│                             │
       │  Create RTCPeerConnection       │                             │
       │  Generate Local SDP Offer       │                             │
       │                                 │                             │
       ├─ (2) Send call_offer ──────────►│                             │
       │  (SDP Offer)                    ├─ (3) Forward call_offer ───►│
       │                                 │      (SDP Offer)            │ Show Incoming call modal
       │                                 │                             │ User accepts:
       │                                 │                             │ Create RTCPeerConnection
       │                                 │                             │ Apply Remote Offer
       │                                 │                             │ Generate Local SDP Answer
       │                                 │◄─ (4) Send call_answer ─────┤
       │◄─ (5) Forward call_answer ──────┤      (SDP Answer)           │
       │   (SDP Answer)                  │                             │
       │                                 │                             │
       │── (6) ice_candidate ───────────►│                             │
       │   (Iterative Candidates)        ├─ (7) Forward ice_candidate ─►│ Apply Ice Candidate
       │                                 │                             │
       │◄─ (9) Forward ice_candidate ────┤◄─ (8) ice_candidate ────────┤
       │   Apply Ice Candidate           │   (Iterative Candidates)    │
       ▲                                 ▼                             ▲
       └───────────────────────── Connected Peer-to-Peer ──────────────┘
```

### Protocol Steps:
1. **Initiate Call**:
   - The Caller requests local camera and microphone streams:
     `navigator.mediaDevices.getUserMedia({ video: true, audio: true })`
   - Initializes a new `RTCPeerConnection` instance using a public STUN/TURN server configuration (e.g., Google’s public STUN servers).
   - Binds the local media tracks to the connection instance.
   - Generates an SDP offer: `peerConnection.createOffer()`.
   - Saves it locally: `peerConnection.setLocalDescription(offer)`.
   - Sends a `call_offer` event containing the SDP details to the WebSocket gateway.
2. **Handle Incoming Offer**:
   - The Callee receives the forwarded `call_offer` event and displays an incoming call ring overlay.
   - If the user declines the call, it triggers a rejection signal.
   - If the user accepts:
     - Request local media streams and bind the tracks to a new local `RTCPeerConnection` instance.
     - Saves the remote offer parameters: `peerConnection.setRemoteDescription(offer)`.
     - Generates an SDP answer: `peerConnection.createAnswer()`.
     - Saves it locally: `peerConnection.setLocalDescription(answer)`.
     - Sends a `call_answer` event back through the WebSocket gateway.
3. **ICE Candidate Exchange**:
   - Both browsers listen for network pathway candidates via the `peerConnection.onicecandidate` event handler.
   - Each pathway candidate is forwarded to the other party via `ice_candidate` WebSocket messages.
   - The receiving browser immediately registers the candidate: `peerConnection.addIceCandidate(candidate)`.
4. **Establish Stream**:
   - Once network paths are negotiated, the connection is established. Incoming tracks are rendered in standard HTML `<video>` elements.

---

## 3. Daily.co Group Call Subsystem

Group calls bypass peer-to-peer WebRTC connections. Instead, they are routed to a dynamically provisioned room hosted on Daily.co's infrastructure.

```
[Client]                                  [Next.js API]               [Daily.co REST API]
   │                                            │                              │
   ├─ POST /api/conversations/:id/call ────────►│                              │
   │                                            ├─ POST /v1/rooms ────────────►│
   │                                            │  (Creates secure room URL)   │
   │                                            │◄─ Returns Room URL ──────────┤
   │                                            │                              │
   │◄─ Returns { roomUrl } ─────────────────────┤                              │
   │                                            │                              │
   │ (Broadcasts group_call_incoming to WS)     │                              │
```

1. **Room Creation**:
   - When a group call is initiated, the client sends a `POST /api/conversations/:id/call` request to the backend.
   - The server makes a secure request to the Daily.co API (`POST https://api.daily.co/v1/rooms`) to create a meeting room with a strict 1-hour expiration time.
2. **Invitation Broadcast**:
   - The server returns the generated `roomUrl` to the initiator.
   - The server broadcasts a `group_call_incoming` WebSocket notification to all conversation members.
3. **Join Meeting**:
   - Members receive the notification and open the meeting interface, which initializes the Daily.co client SDK using the provided `roomUrl`.
