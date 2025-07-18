import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
function componentTagger() {
  return {
    name: 'component-tagger',
    transform(code: string, id: string) {
      if (id.endsWith('.tsx') || id.endsWith('.jsx')) {
        // Add data-testid attributes to React components for easier testing
        const componentRegex = /<([A-Z][a-zA-Z0-9]*)/g;
        return code.replace(componentRegex, (match, componentName) => {
          return `<${componentName} data-testid="${componentName.toLowerCase()}"`;
        });
      }
      return null;
    }
  };
}

