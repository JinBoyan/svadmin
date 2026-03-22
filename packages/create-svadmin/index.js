#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prompts from 'prompts';
import pc from 'picocolors';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function init() {
  console.log(`\n${pc.cyan('Welcome to create-svadmin!')}\n`);

  const response = await prompts([
    {
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      initial: 'svadmin-app',
      validate: (value) => {
        if (!value.trim()) return 'Project name is required';
        if (fs.existsSync(value.trim()) && fs.readdirSync(value.trim()).length > 0) {
          return 'Directory already exists and is not empty';
        }
        return true;
      }
    },
    {
      type: 'select',
      name: 'dataProvider',
      message: 'Choose a default Data Provider:',
      choices: [
        { title: 'Simple REST', value: 'simple-rest', description: 'Standard JSON APIs / JSON Server' },
        { title: 'Supabase', value: 'supabase', description: 'PostgreSQL Backend-as-a-Service' },
        { title: 'GraphQL', value: 'graphql', description: 'Generic GraphQL endpoints' },
        { title: 'None (Build Your Own)', value: 'none', description: 'Implement the DataProvider interface yourself' }
      ],
      initial: 0
    }
  ]);

  if (!response.projectName) {
    console.log(pc.red('Operation cancelled.'));
    return;
  }

  const projectDir = path.resolve(process.cwd(), response.projectName.trim());
  
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  console.log(`\nScaffolding project in ${pc.green(projectDir)}...`);

  // Basic template files
  const templateDir = path.join(__dirname, 'template');
  
  // We will create the template files dynamically here to avoid needing a complex nested template repo directory.
  // In a real scenario, we'd copy `templateDir` contents recursively.
  const packageJson = {
    name: response.projectName,
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: {
      "dev": "vite dev",
      "build": "vite build",
      "preview": "vite preview",
      "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"
    },
    dependencies: {
      "@svadmin/core": "latest",
      "@svadmin/ui": "latest",
      "lucide-svelte": "^0.475.0",
    },
    devDependencies: {
      "@sveltejs/adapter-auto": "^4.0.0",
      "@sveltejs/kit": "^2.17.2",
      "@sveltejs/vite-plugin-svelte": "^5.0.0",
      "svelte": "^5.20.0",
      "tailwindcss": "^3.4.17",
      "vite": "^6.1.0"
    }
  };

  if (response.dataProvider === 'simple-rest') {
    packageJson.dependencies["@svadmin/simple-rest"] = "latest";
  } else if (response.dataProvider === 'supabase') {
    packageJson.dependencies["@svadmin/supabase"] = "latest";
    packageJson.dependencies["@supabase/supabase-js"] = "^2.0.0";
  } else if (response.dataProvider === 'graphql') {
    packageJson.dependencies["@svadmin/graphql"] = "latest";
    packageJson.dependencies["graphql-request"] = "^7.1.0";
    packageJson.dependencies["graphql"] = "^16.8.0";
  }

  fs.writeFileSync(
    path.join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Copy template files
  function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    let entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
      let srcPath = path.join(src, entry.name);
      let destPath = path.join(dest, entry.name === '_gitignore' ? '.gitignore' : entry.name);

      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  if (fs.existsSync(templateDir)) {
    copyDir(templateDir, projectDir);
    console.log(pc.green('✔') + ' Copied template files');
  }

  // Next steps instructions
  console.log(`\nNext steps:`);
  console.log(`  1. ${pc.cyan(`cd ${response.projectName}`)}`);
  console.log(`  2. ${pc.cyan('npm install')} or ${pc.cyan('bun install')}`);
  console.log(`  3. ${pc.cyan('npm run dev')}`);
  console.log(`\nFor documentation, visit: ${pc.blue('https://github.com/zuohuadong/svadmin')}\n`);
}

init().catch(console.error);
