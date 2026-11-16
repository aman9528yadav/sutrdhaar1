# Sutradhaar - Smart Productivity & Finance Suite

Sutradhaar is a modern, comprehensive, and feature-rich productivity and finance web application. Built with Next.js, TypeScript, and Tailwind CSS, it offers a clean, responsive, and user-friendly interface. Evolving far beyond simple unit conversions, Sutradhaar now encompasses a full suite of tools including an advanced Budget Tracker, AI Assistant, extensive financial and programmer calculators, Todo list, Notes, secure Password Generation, and much more, all accessible from a customizable interactive dashboard.

## ✨ Features

- **📊 Interactive Dashboard:** A central hub to view your usage statistics, advanced analytics, activity breakdown charts, and usage trends.
- **⚡ Customizable Quick Access:** Easily navigate to the app's main features. You can reorder and hide items to personalize your dashboard.
- **💰 Comprehensive Budget Tracker:** Manage your finances with transaction lists, budget goals, budget analytics, and bill reminders. Includes a 'Magic Entry' feature for quick natural language transaction logging.
- **🤖 AI Assistant:** Built-in AI powered by Genkit to help you with queries, calculations, and seamless app interaction.
- **📝 Todo & Notes Manager:** A full-featured modern todo manager (with priorities and recurring schedules) and a rich text notes editor to keep your life organized.
- **🔄 Smart Unit Converter:** Enhanced unit converter covering a wide variety of categories (including international and Indian units), with single-click swapping and comparison dialogs.
- **🧮 Advanced Calculators:** 
  - *Scientific Calculator* for complex math.
  - *Financial & Loan Calculators* for managing discounts, EMIs, and investments.
  - *Programmer Calculator* designed specifically for developers.
  - *Date Calculator* for precise timeline and interval math.
- **🔒 Password Generator:** Generate strong, secure passwords on the fly.
- **🌐 Translator Tool:** Instant language translation to break down barriers.
- **⏲️ Productivity Tools:** Features a visual Timer and a precise Stopwatch with lap functionality.
- **📜 Persistent History:** Your conversions, calculations, and data are securely saved.
- **👤 User Profile & Membership:** Dedicated profile and progression page to view stats, manage personal info, and explore membership features.
- **🧭 Welcome Tour:** An interactive onboarding experience to help new users navigate the rich feature set.
- **🎨 Modern & Responsive UI:** Built with ShadCN UI, Framer Motion, and Tailwind CSS for a beautiful, consistent, and animated experience on any device (including PWA support).
- **🔐 Authentication & Data:** Secure login and real-time data sync using Firebase Authentication and Supabase.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (with App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
- **Authentication:** [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Database & Realtime:** [Supabase](https://supabase.com/)
- **AI/Generative:** [Genkit](https://firebase.google.com/docs/genkit)
- **Icons:** [Lucide React](https://lucide.dev/guide/packages/lucide-react)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Charts:** [Recharts](https://recharts.org/)
- **PWA Support:** `next-pwa`

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v20 or later)
- npm or yarn
- A Firebase project with Authentication enabled
- A Supabase project for database features

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone <YOUR_REPOSITORY_URL>
    cd nextn
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    # or
    yarn install
    ```
    
3.  **Set up Environment Variables:**
    - Create a `.env.local` file in the root directory.
    - Add your Firebase configuration keys.
    - Add your Supabase URL and Anon Key.
    - Add your Google Gemini API keys (for AI/Genkit features).

4.  **Run the development server:**
    ```sh
    npm run dev
    # or
    yarn dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

The project follows a standard Next.js App Router structure:

-   `src/app/`: Contains all the pages, API routes, and layouts for the application.
-   `src/components/`: Contains all the reusable React components, widgets, calculators, and UI elements.
-   `src/context/`: Contains React context providers for managing global state.
-   `src/lib/`: Contains utility functions, constants, and database configurations.
-   `src/hooks/`: Contains custom React hooks for specific functionalities.
-   `src/ai/`: Contains AI-related logic, including Genkit flows.
-   `public/`: Contains static assets like images, icons, and PWA manifests.

## ✍️ Author

-   **Aman Yadav** - *Developer*
