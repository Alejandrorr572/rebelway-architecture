# RebelWay Guitar Gallery

*A microservices-based full-stack application initially designed as a personal guitar cover gallery, with an architecture ready to scale into a niche social media platform.*

The main goal of this project is to integrate **Kubernetes** and **Nginx** into the ecosystem, and to implement **polyglot persistence** combining **PostgreSQL** (for structured/immutable data) and **MongoDB** (for dynamic/document data) to serve different microservices within a single cohesive platform.

## Tech Stack & Technologies

*   **Frontend:** [Angular](https://angular.io) with Angular CLI, Bootstrap, and SCSS.
*   **Backend:** [Node.js](https://nodejs.org) and [Express.js](http://expressjs.com) (TypeScript).
*   **Databases (Polyglot):** 
    *   [PostgreSQL](https://www.postgresql.org/) (Relational Catalog via TypeORM).
    *   [MongoDB](https://www.mongodb.com/) (Dynamic Social Documents via Mongoose).
*   **Infrastructure & DevOps:** Docker, Kubernetes (K8s), and Nginx (Ingress/Reverse Proxy).
*   **External Integrations:** Spotify Web API (Track Metadata & Previews).
*   **Security:** JSON Web Token (JWT) and Bcrypt.js.

## Project Roadmap 

- [x] Initial system design and architecture planning (Mermaid ERD & Flowcharts).
- [x] Baseline cleanup and migration to a decoupled Client/Server structure.
- [ ] Containerize PostgreSQL and MongoDB environments using Docker Compose.
- [ ] Implement the Node.js backend with TypeORM and Mongoose.
- [ ] Develop the Angular frontend and integrate the Spotify Web API.
- [ ] Configure Nginx as a Reverse Proxy and API Gateway.
- [ ] Orchestrate the entire ecosystem using local Kubernetes (Minikube/Kind).

## Architecture

```mermaid
---
config:
  layout: elk
---
flowchart TD
    Client([User]) -->|TCP Petition| LB[External Nginx Load Balancer<br> On-Premise]

    subgraph K8s [Local Kubernetes Cluster]
        direction TB
        Ingress[Nginx Ingress Controller<br>Router App Layer]
        
        subgraph Microservices
            Front[Frontend Angular<br>Micro-Cached]
            Back[Backend Node/Express<br>API REST]
        end

        subgraph Polyglot_Persistence ["Polyglot Persistence"]
            PG[(PostgreSQL<br>Song Catalogue)]
            Mongo[(MongoDB<br>Users and Covers)]
        end
        
        LB -->|Filtered Traffic| Ingress
        Ingress -->|Static Routes /| Front
        Ingress -->|Dynamic Routes /api| Back
        
        Back -->|Relational Queries| PG
        Back -->|Dynamic Documents| Mongo
    end
```

## Data Model

```mermaid
erDiagram
    %% PostgreSQL (Relational & Immutable Domain)
    ARTIST ||--o{ SONG : "composes"
    ARTIST {
        uuid id PK
        string name
        string spotify_url
    }
    SONG {
        uuid id PK
        string title
        int duration_ms
        string cover_url
        uuid artist_id FK
        string preview_url  "nullable"
    }

    %% Polyglot Logical Boundary (Managed by the Backend)
    SONG ||--o{ COVER_POST : "referenced by"

    %% MongoDB (Document & Dynamic Domain)
    USER ||--o{ COVER_POST : "publishes"
    USER {
        objectId _id PK
        string username
        string password_hash
        string bio
    }
    COVER_POST {
        objectId _id PK
        objectId user_id "Ref: Mongo User"
        uuid song_id "Ref: Postgres Song"
        string video_url
        string[] gear_used
        int difficulty
        object[] comments
    }
```

## Local Development Setup (WIP)
Note: Run instructions are currently being updated to reflect the new decoupled microservices architecture.

Clone the repository.

Initialize the frontend: cd client && npm install

Initialize the backend microservice: cd server && npm install

(Upcoming) Spin up the database containers via docker-compose up -d.

Author
Alejandro Rivada