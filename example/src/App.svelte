<script lang="ts">
  import { AdminApp, setRichTextEditor } from '@svadmin/ui';
  import { Editor } from '@svadmin/editor';
  import '@svadmin/ui/app.css';
  import { createSimpleRestDataProvider } from '@svadmin/simple-rest';
  import { resources } from './resources';
  import { mockAuthProvider } from './providers/mockAuth';

  const dataProvider = createSimpleRestDataProvider({
    apiUrl: 'https://jsonplaceholder.typicode.com',
  });

  // Register the optional Rich Text Editor plugin globally
  setRichTextEditor(Editor);
</script>

<AdminApp {dataProvider} {resources} authProvider={mockAuthProvider} title="svadmin Demo" locale="en" />
