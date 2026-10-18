export const systemDesignProblems = [
  {
    id: "url-shortener",
    title: "Design a URL Shortener",
    category: "Fundamentals",
    difficulty: "Easy",
    pattern: "Read-heavy systems",
    description:
      "Design a service that converts long URLs into short links with redirects, expiration, and analytics.",
    concepts: ["API Design", "Hashing", "Database Indexing", "Caching"],
    practiceUrl: "https://systemdesign.one/url-shortening",
  },
  {
    id: "rate-limiter",
    title: "Design a Rate Limiter",
    category: "Fundamentals",
    difficulty: "Medium",
    pattern: "Traffic control",
    description:
      "Limit requests using token bucket, sliding window, or fixed window algorithms.",
    concepts: ["Redis", "Rate Limiting", "Distributed Systems"],
    practiceUrl: "https://systemdesign.one/rate-limiter",
  },
  {
    id: "pastebin",
    title: "Design Pastebin",
    category: "Fundamentals",
    difficulty: "Easy",
    pattern: "Content storage",
    description:
      "Store and retrieve text snippets with unique IDs, expiration, and access controls.",
    concepts: ["Object Storage", "Database Design", "Caching"],
    practiceUrl: "https://systemdesign.one/",
  },
  {
    id: "chat",
    title: "Design a Chat Application",
    category: "Real-time Systems",
    difficulty: "Medium",
    pattern: "Real-time communication",
    description:
      "Support messaging, delivery status, online presence, and reliable message storage.",
    concepts: ["WebSockets", "Message Queues", "Database Design"],
    practiceUrl: "https://systemdesign.one/",
  },
  {
    id: "notification",
    title: "Design a Notification System",
    category: "Real-time Systems",
    difficulty: "Medium",
    pattern: "Asynchronous processing",
    description:
      "Deliver email, SMS, and push notifications with retries and delivery tracking.",
    concepts: ["Queues", "Retries", "Idempotency"],
    practiceUrl: "https://systemdesign.one/",
  },
  {
    id: "live-comments",
    title: "Design Live Comments",
    category: "Real-time Systems",
    difficulty: "Medium",
    pattern: "Real-time updates",
    description:
      "Distribute live comments and updates to users viewing the same content.",
    concepts: ["WebSockets", "Pub/Sub", "Horizontal Scaling"],
    practiceUrl: "https://systemdesign.one/",
  },
  {
    id: "drive",
    title: "Design Google Drive",
    category: "Storage and Data",
    difficulty: "Hard",
    pattern: "File storage",
    description:
      "Support uploads, downloads, file sharing, synchronization, and version history.",
    concepts: ["Object Storage", "Metadata", "Replication"],
    practiceUrl: "https://systemdesign.one/",
  },
  {
    id: "news-feed",
    title: "Design a News Feed",
    category: "Storage and Data",
    difficulty: "Hard",
    pattern: "Feed generation",
    description:
      "Generate personalized feeds using fan-out on write or fan-out on read.",
    concepts: ["Caching", "Fan-out", "Ranking"],
    practiceUrl: "https://systemdesign.one/",
  },
  {
    id: "search",
    title: "Design a Search Autocomplete System",
    category: "Storage and Data",
    difficulty: "Hard",
    pattern: "Prefix search",
    description:
      "Return relevant suggestions quickly while handling frequent updates.",
    concepts: ["Tries", "Caching", "Ranking"],
    practiceUrl: "https://systemdesign.one/",
  },
  {
    id: "video",
    title: "Design a Video Streaming Platform",
    category: "High-Traffic Platforms",
    difficulty: "Hard",
    pattern: "Media delivery",
    description:
      "Support video uploads, transcoding, adaptive streaming, and global delivery.",
    concepts: ["CDN", "Object Storage", "Background Jobs"],
    practiceUrl: "https://systemdesign.one/",
  },
  {
    id: "food",
    title: "Design a Food Delivery System",
    category: "High-Traffic Platforms",
    difficulty: "Hard",
    pattern: "Location-based marketplace",
    description:
      "Coordinate customers, restaurants, delivery partners, orders, and live tracking.",
    concepts: ["Geospatial Search", "Event Processing", "Consistency"],
    practiceUrl: "https://systemdesign.one/",
  },
  {
    id: "booking",
    title: "Design a Ticket Booking System",
    category: "High-Traffic Platforms",
    difficulty: "Hard",
    pattern: "Concurrency and reservations",
    description:
      "Prevent double booking while handling high demand and temporary seat reservations.",
    concepts: ["Transactions", "Locking", "Idempotency"],
    practiceUrl: "https://systemdesign.one/",
  },
];

export const systemDesignConcepts = [
  {
    id: "scalability",
    title: "Scalability",
    category: "Architecture",
    description:
      "Horizontal versus vertical scaling, bottlenecks, and stateless services.",
  },
  {
    id: "load-balancing",
    title: "Load Balancing",
    category: "Architecture",
    description:
      "Distribute requests across healthy servers and understand balancing strategies.",
  },
  {
    id: "microservices",
    title: "Microservices",
    category: "Architecture",
    description:
      "Service boundaries, independent deployments, and inter-service communication.",
  },
  {
    id: "sql-vs-nosql",
    title: "SQL vs NoSQL",
    category: "Data and Performance",
    description:
      "Choose data models based on query patterns, relationships, consistency, and scale.",
  },
  {
    id: "caching",
    title: "Caching",
    category: "Data and Performance",
    description: "Cache-aside, TTL, invalidation, eviction, and Redis.",
  },
  {
    id: "replication-and-sharding",
    title: "Replication and Sharding",
    category: "Data and Performance",
    description:
      "Improve availability and distribute data across database nodes.",
  },
  {
    id: "database-indexing",
    title: "Database Indexing",
    category: "Data and Performance",
    description:
      "Understand indexes, query plans, write overhead, and composite indexes.",
  },
  {
    id: "message-queues",
    title: "Message Queues",
    category: "Reliability",
    description:
      "Decouple services and process work asynchronously with retries.",
  },
  {
    id: "consistency",
    title: "Consistency",
    category: "Reliability",
    description:
      "Understand strong and eventual consistency and their trade-offs.",
  },
  {
    id: "fault-tolerance",
    title: "Fault Tolerance",
    category: "Reliability",
    description:
      "Timeouts, retries, circuit breakers, redundancy, and graceful degradation.",
  },
  {
    id: "cap-theorem",
    title: "CAP Theorem",
    category: "Reliability",
    description:
      "Understand consistency and availability trade-offs during network partitions.",
  },
];
