# Salesforce Interview Preparation App

This is a simple application to help you prepare for Salesforce interviews. It's built with LWC Open Source and Vite.

## How to Run Locally

1.  **Install Dependencies:**
    If you haven't already, install the necessary npm packages.
    ```bash
    npm install
    ```

2.  **Start the Development Server:**
    This command will start the Vite development server and you can view your application at `http://localhost:3000`.
    ```bash
    npm run dev
    ```

## How to Deploy to GitHub Pages

1.  **Build the Application:**
    This command will create a `dist` folder with the production-ready files.
    ```bash
    npm run build
    ```

2.  **Deploy to GitHub Pages:**
    You can use a tool like `gh-pages` to deploy the `dist` folder to your GitHub repository's `gh-pages` branch.

    First, install `gh-pages`:
    ```bash
    npm install gh-pages --save-dev
    ```

    Then, add a `deploy` script to your `package.json`:
    ```json
    "scripts": {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview",
      "deploy": "gh-pages -d dist"
    }
    ```

    Finally, run the deploy script:
    ```bash
    npm run deploy
    ```

    This will deploy your application to `https://<your-username>.github.io/<your-repo-name>/`.
