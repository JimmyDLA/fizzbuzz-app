# FizzBuzz Party: Server & Scaling Cost Analysis
*A Guide to Hosting and Scaling real-time multiplayer Node.js/Colyseus server on a bootstrapped budget.*

---

## 1. Understanding Multiplayer Server Infrastructure

Traditional apps (like social networks or e-commerce sites) use **HTTP request/response cycles**. A user requests data, the server answers, and the connection instantly closes. 

**FizzBuzz Party** is a real-time multiplayer game. It uses **persistent WebSockets** via the Colyseus framework. 
* Players open a connection and keep it open for the entire duration of their play session.
* The server maintains game room states in memory (RAM).
* The server continuously broadcasts state changes (e.g., player clicks, countdown timers) to all connected clients multiple times per second.

Because of this, server scaling is driven by two main factors:
1. **Memory (RAM):** Keeps concurrent game rooms and client connections open.
2. **CPU and Bandwidth:** Drives the rapid serialization and transmission of game updates to players.

---

## 2. Server Cost Estimates by Traffic Scale

Because Colyseus is highly optimized, a single-core virtual private server can handle hundreds of concurrent players (CCU) if the game logic is clean. Below are cost estimates across growth phases.

```
       0 - 100 CCU (Beta/Dev)   ──>  Free to $10 / month (Render, DigitalOcean)
     100 - 500 CCU (Moderate)   ──>  $12 to $25 / month
   500 - 2,000 CCU (Viral Peak) ──>  $40 to $100 / month
 2,000 - 5,000 CCU (High Scale) ──>  $150 to $300 / month
```

### Tier 1: Development & Beta (0 – 100 CCU)
*   **Active Lobbies:** Up to 15 concurrent game rooms.
*   **Infrastructure:** Shared CPU instance (512MB – 1GB RAM).
*   **Hosting Recommendation:** **Render Starter** ($7/month) or **Railway** ($5/month).
*   **Estimated Cost:** **$5 – $10 / month**

### Tier 2: Launch & Early Growth (100 – 500 CCU)
*   **Active Lobbies:** Up to 75 concurrent game rooms.
*   **Infrastructure:** Dedicated resources node (1 vCPU, 2GB RAM).
*   **Hosting Recommendation:** **DigitalOcean Basic Droplet** ($12/month) or **Render Standard** ($25/month).
*   **Estimated Cost:** **$12 – $25 / month**

### Tier 3: Viral Spike / Peak Hours (500 – 2,000 CCU)
*   **Active Lobbies:** Up to 300 concurrent game rooms.
*   **Infrastructure:** Scaled instances (2 vCPUs, 4GB RAM) or 2 scaled nodes behind a load balancer.
*   **Hosting Recommendation:** **DigitalOcean Basic Droplet** ($24–$48/month) or **Render Pro** ($85/month).
*   **Estimated Cost:** **$40 – $100 / month**

### Tier 4: High-Scale Success (2,000 – 5,000 CCU)
*   **Active Lobbies:** Up to 750 concurrent game rooms.
*   **Infrastructure:** Horizontal scaling using Colyseus Redis matchmaker + load balancer (multiple 2GB RAM nodes).
*   **Hosting Recommendation:** **DigitalOcean Managed Kubernetes** or **Fly.io** cluster.
*   **Estimated Cost:** **$150 – $300 / month**

---

## 3. Hosting Provider Comparison (Bootstrapper Perspective)

| Host Platform | Estimated Base Cost | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **PaaS**<br>*(Render, Railway, Fly.io)* | **$7 - $25 / month** | • Deploy straight from GitHub.<br>• Automated SSL certificates.<br>• Easy scaling slider buttons.<br>• Managed infrastructure. | • Slightly more expensive per GB of RAM than raw servers. |
| **IaaS (VPS)**<br>*(DigitalOcean, Linode)* | **$6 - $12 / month** | • Best resource-to-cost value.<br>• Highly customizable.<br>• Dedicated IP address.<br>• Generous free bandwidth pool. | • Requires manual server setup (Linux/Docker/Nginx).<br>• No automatic security updates. |
| **Enterprise Cloud**<br>*(AWS, Google Cloud)* | **$15 - $50+ / month** | • Infinite scalability.<br>• Elite server reliability.<br>• Comprehensive dashboards. | • **High danger of surprise bills.**<br>• Complex configuration.<br>• Expensive outbound bandwidth. |

---

## 4. The Hidden Egress Bandwidth Trap

While RAM and CPU are billed at a flat rate, **network egress (outbound data)** is metered on major clouds. WebSockets send thousands of messages per hour, which can generate massive bandwidth costs.

### Bandwidth Consumption Calculation:
*   Assume the game loop broadcasts state updates **15 times per second**.
*   Average message size is **1.5 KB**.
*   A 4-player game playing for **15 minutes** consumes:
    $$\text{Data per player} = 1.5 \text{ KB} \times 15 \text{ frames/sec} \times 900 \text{ seconds} = 20,250 \text{ KB} \approx 20 \text{ MB}$$
    $$\text{Total Room Egress} = 20 \text{ MB} \times 4 \text{ players} = 80 \text{ MB}$$
*   At **1,000 CCU** playing continuously:
    $$1,000 \text{ players} \times 20 \text{ MB/hour} = 20 \text{ GB of bandwidth per hour}$$
    $$\text{Daily Bandwidth} = 480 \text{ GB / Day} \approx \mathbf{14.4\text{ TB / Month}}$$

### Provider Egress Pricing Comparison:
*   **AWS (EC2/Fargate):** Charges ~$0.09 per GB. 14.4 TB of bandwidth would cost **$1,296 / month**!
*   **DigitalOcean:** A basic $12/month Droplet comes with **2 TB of bandwidth free**. Excess bandwidth is only $0.01 per GB. 14.4 TB of bandwidth would cost **$124 / month**.
*   **Render:** Free bandwidth tier is **100 GB/month**. Additional bandwidth is $0.10 per GB. 14.4 TB would cost **$1,430 / month**.

> [!IMPORTANT]
> To protect your $10k budget, start your project on **DigitalOcean** or **Render**, keeping a close eye on bandwidth metrics. Avoid AWS/GCP until you have high revenues to cover utility fees.

---

## 5. Architectural Optimization to Reduce Costs

As a solo developer, you can write your backend code specifically to minimize server bills:

### A. Reduce the Broadcast Rate (Colyseus Patch Rate)
*   By default, real-time games sync at 30Hz or 60Hz. Because FizzBuzz is a turn-based or casual tap-based game, you do not need ultra-low latency.
*   Configure the room patch rate to **100ms (10Hz)**:
    ```typescript
    // In your Colyseus room configuration:
    this.setPatchRate(100); 
    ```
*   *Result:* Cuts server CPU usage and bandwidth consumption by **66%** compared to a 30Hz default.

### B. Auto-Disconnect Idle Rooms
*   If players leave their phones open on a table and walk away, the room consumes memory. Add an aggressive auto-cleanup script:
    ```typescript
    // Disconnect rooms with no active interactions for 5 minutes
    this.clock.setTimeout(() => {
        if (this.clients.length === 0) {
            this.disconnect();
        }
    }, 300000); // 5 minutes
    ```

### C. Offload Physics and Drawing to the Client
*   The server should only track **scores, player readiness, room codes, and game state changes** (e.g., transitions from `playing` to `resolution`).
*   Let the mobile app handle animations, tap particle effects, and sound playback locally. Never compute visual movements on the server.

### D. Avoid Memory Leaks (State Optimization)
*   Only place variables that need to sync with other players inside the Colyseus `@type` schema. 
*   Temporary variables (like round timer instances or animation loops) should be kept as local variables inside the room class rather than the synchronization state.
