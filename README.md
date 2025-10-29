# Unison

[cloudflarebutton]

Unison is an anonymous, single-topic message board designed with a minimalist aesthetic. The application provides a serene, focused space for discussion. It operates as a single-page application where users can read a stream of messages and contribute their own without needing an account. The core components are a clean header defining the topic, a simple form for message submission, and a chronologically ordered list of messages. The design prioritizes clarity, generous white space, and subtle interactions to create a calm and inviting user experience.

## ✨ Key Features

*   **Anonymous Posting**: Contribute messages without needing an account or login.
*   **Single-Topic Focus**: A dedicated space for discussions around a specific theme.
*   **Minimalist UI**: Clean, uncluttered design with generous white space for a serene experience.
*   **Real-time Stream**: Messages are displayed in reverse chronological order and can be refreshed to see new contributions.
*   **Intuitive User Journey**: Simple form for message submission with immediate feedback.
*   **Responsive Design**: Flawless layouts and interactions across all device sizes.
*   **Subtle Interactions**: Smooth animations, hover states, and micro-interactions for a delightful user experience.

## 🚀 Technology Stack

Unison is built with a modern web stack, leveraging Cloudflare's powerful edge platform:

*   **Frontend**:
    *   **React**: A declarative, component-based JavaScript library for building user interfaces.
    *   **Tailwind CSS**: A utility-first CSS framework for rapidly styling components.
    *   **shadcn/ui**: A collection of beautifully designed React components built with Radix UI and Tailwind CSS.
    *   **Framer Motion**: A production-ready motion library for React to power animations.
    *   **Lucide React**: A collection of beautiful and customizable open-source icons.
    *   **date-fns**: A modern JavaScript date utility library.
    *   **Zustand**: A small, fast, and scalable bear-necessities state-management solution.
    *   **Zod**: A TypeScript-first schema declaration and validation library.
*   **Backend**:
    *   **Hono**: A small, simple, and ultrafast web framework for the edge.
    *   **Cloudflare Workers**: Serverless execution environment for running JavaScript, WebAssembly, and more on Cloudflare's global network.
*   **Persistence**:
    *   **Cloudflare Durable Objects**: Provides strongly consistent storage and coordination for your Workers.
*   **Tooling**:
    *   **TypeScript**: A strongly typed superset of JavaScript that compiles to plain JavaScript.
    *   **Vite**: A fast frontend build tool that provides an extremely fast development experience.

## 🛠️ Setup and Installation

To get Unison up and running on your local machine, follow these steps:

### Prerequisites

*   **Bun**: A fast all-in-one JavaScript runtime. [Install Bun](https://bun.sh/docs/installation)
*   **Cloudflare Account**: Required for deploying the application.
*   **Wrangler CLI**: Cloudflare's command-line tool for developing and deploying Workers. [Install Wrangler](https://developers.cloudflare.com/workers/wrangler/install-update/)

### Steps

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd unison_board
    ```

2.  **Install dependencies**:
    ```bash
    bun install
    ```

3.  **Cloudflare Configuration**:
    *   Log in to your Cloudflare account via Wrangler:
        ```bash
        wrangler login
        ```
    *   The project is pre-configured to use a single Durable Object named `GlobalDurableObject` for message storage, as defined in `wrangler.jsonc`. No additional configuration is needed for the Durable Object binding.

## 👨‍💻 Development

### Start the development server

To run the application in development mode:

```bash
bun dev
```

This command will:
*   Start the frontend development server (typically on `http://localhost:3000`).
*   Launch a local Cloudflare Worker environment that simulates the edge, including Durable Object interactions.

### Linting

To check for code quality and style issues:

```bash
bun lint
```

## ☁️ Deployment

Unison is designed for seamless deployment to Cloudflare Workers.

1.  **Build the project**:
    ```bash
    bun run build
    ```

2.  **Deploy to Cloudflare**:
    ```bash
    bun run deploy
    ```
    Wrangler will guide you through the deployment process, including selecting your Cloudflare account and zone.

Alternatively, you can deploy directly using the Cloudflare button:

[cloudflarebutton]

## 🌐 API Endpoints

The backend, powered by a Hono Worker and Cloudflare Durable Objects, exposes the following main API endpoints:

*   `GET /api/messages`: Retrieves a list of all messages posted on the board.
*   `POST /api/messages`: Submits a new message to the board. The request body should contain the message text.

## ⚠️ Pitfalls and Considerations

While Unison provides a functional and visually appealing message board, it's important to be aware of certain limitations and areas for future improvement:

*   **Spam Vulnerability**: The application currently lacks rate-limiting or user authentication, making it susceptible to spam or abuse.
*   **Scalability**: Fetching the entire message list on every update can become inefficient as the number of messages grows. For a production-scale application, implementing pagination or a more advanced real-time update mechanism would be necessary.
*   **Input Validation**: Although client-side input validation is present, robust server-side validation should be added to prevent invalid or malicious data submissions.
*   **Content Moderation**: Without a content moderation system, the platform could be susceptible to inappropriate content.