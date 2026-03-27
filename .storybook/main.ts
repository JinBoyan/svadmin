/** @type { import('@storybook/svelte-vite').StorybookConfig } */
const config = {
  stories: [
    '../packages/ui/src/**/*.stories.@(svelte|ts)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/svelte-vite',
    options: {},
  },
};

export default config;
