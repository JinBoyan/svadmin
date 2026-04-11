import fs from 'fs';
let file = 'packages/core/src/form-hooks.svelte.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "// We catch here to prevent unhandled promise rejections.\n    }",
  "// We catch here to prevent unhandled promise rejections.\n      throw error;\n    }"
);

fs.writeFileSync(file, content);

// Also AutoForm: we need defaults changes to update form.values.
// The user report: BUG-AF-2: defaults 变化不会更新已初始化的表单值
// In AutoForm.svelte:
file = 'packages/ui/src/components/AutoForm.svelte';
content = fs.readFileSync(file, 'utf8');

// We can add an $effect to watch defaults and update form if the form is not tainted.
const updateDefaultsEffect = `  $effect(() => {
    // If id changes or defaults magically change, we might want to update form values
    // But to respect user input, only update if not tainted, or if changing record
    if (!form.isTainted()) {
      for (const key in defaults) {
        if (form.values[key] !== defaults[key]) {
          form.setFieldValue(key, defaults[key]);
        }
      }
      form.untaint();
    }
  });`;

content = content.replace(
  "const validator = $derived(deriveValidator(formFields));",
  "const validator = $derived(deriveValidator(formFields));\n\n" + updateDefaultsEffect
);

fs.writeFileSync(file, content);
