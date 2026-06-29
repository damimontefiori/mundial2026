# Context Brief: FIFA World Cup 2026 Awards Dashboard
**Target Stack:** Node.js, TypeScript.

## 1. System Overview
This module tracks and projects the official FIFA World Cup 2026 awards. The system differentiates between "Real-Time Projections" (calculated dynamically via match stats) and "Institutional Awards" (assigned manually by the FIFA Technical Study Group post-tournament). 

The web application triggers a data extraction pipeline at the end of each match to update partial results.

## 2. Business Logic: Awards Classification

### A. Real-Time Projections (Calculated dynamically)
These awards are processed and ranked using raw data from the API:
* **Golden Boot (Botín de Oro):** Top scorers. 
    * *Tie-breaker logic:* 1) Total Goals, 2) Total Assists, 3) Fewest Played Matches (or Minutes, if supported by the endpoint).
* **Golden Glove (Guante de Oro):** Best goalkeeper. 
    * *Logic:* Goalkeepers/Teams with the highest number of Clean Sheets (or fewest goals conceded, `goalsAgainst`, derived from standings).
* **Fair Play Award:** Discipline tracking. 
    * *Logic:* Lowest negative point accumulation per team. Yellow Card = -1 pt, Direct/Indirect Red Card = -4 pts.
* **Prize Money (Financial Allocation):** Guaranteed minimum revenue per federation. 
    * *Logic:* Based on the highest tournament stage reached (e.g., Group Stage = $10M USD, Round of 32 = $11M USD, Round of 16 = $15M USD, etc.).

### B. Institutional Awards (Static until the Final)
These must be rendered in the UI with a `Pending` or `TBD` status until the tournament ends:
* **Golden Ball:** Best overall player.
* **Young Player Award:** Best player born on or after Jan 1, 2005.

## 3. Data Integration Strategy

### Provider: Football-Data.org (v4 API)
* **Reason for selection:** Unlike other commercial APIs (which lock current seasons behind premium tiers), Football-Data provides access to the active World Cup (`WC`) competition on its free tier.
* **Authentication:** Requires an `X-Auth-Token` passed in the request headers.
* **Rate Limits:** 10 requests per minute.

### Endpoints in Use:
1.  `GET https://api.football-data.org/v4/competitions/WC/scorers` (Used for Golden Boot rankings).
2.  `GET https://api.football-data.org/v4/competitions/WC/standings` (Used for Fair Play, Golden Glove projections, and Prize Money calculation based on matches played/stage).

## 4. Architectural Pattern: BFF (Backend For Frontend)
Direct client-to-API calls are **strictly prohibited** in this architecture due to CORS policies enforced by Football-Data.org and to prevent exposing the API token.

**Node.js / TypeScript Implementation Requirements:**
1.  **Proxy/BFF Layer:** The Node.js server must expose internal endpoints (e.g., `/api/awards/scorers`). The frontend calls this internal Node.js route.
2.  **Server-to-Server Fetch:** The Node.js backend handles the actual `fetch` or `axios` call to `api.football-data.org`, injecting the `X-Auth-Token` securely from environment variables (`process.env.FOOTBALL_API_TOKEN`).
3.  **Caching Mechanism:** Given the 10 req/min limit, the Node.js backend should cache the API response (e.g., using Redis or an in-memory cache) after the end-of-match trigger, serving the cached JSON to all frontend clients to avoid rate-limiting.

## 5. TypeScript Interfaces (Draft)
When building the backend services, expect and map the following payload structures from the API:

```typescript
export interface ScorerResponse {
  count: number;
  competition: { id: number; name: string };
  scorers: Array<{
    player: { id: number; name: string; nationality: string };
    team: { id: number; name: string };
    goals: number;
    assists: number | null;
    playedMatches: number;
  }>;
}

export interface StandingsResponse {
  standings: Array<{
    stage: string;
    type: string; // usually "TOTAL"
    table: Array<{
      position: number;
      team: { id: number; name: string };
      playedMatches: number;
      goalsFor: number;
      goalsAgainst: number;
      goalDifference: number;
    }>;
  }>;
}