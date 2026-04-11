import fs from 'fs';

// 1. VoiceInput.svelte
let voiceContent = fs.readFileSync('packages/ui/src/components/VoiceInput.svelte', 'utf8');
voiceContent = voiceContent.replace(
  "      if (onend) onend();\n    };\n  });\n\n  function toggleListening(e?: MouseEvent) {",
  `      if (onend) onend();\n    };\n\n    return () => {\n      if (recognition) {\n        recognition.stop();\n        recognition.onstart = null;\n        recognition.onresult = null;\n        recognition.onerror = null;\n        recognition.onend = null;\n      }\n    };\n  });\n\n  function toggleListening(e?: MouseEvent) {`
);
fs.writeFileSync('packages/ui/src/components/VoiceInput.svelte', voiceContent);

// 2. Sidebar.svelte
let sideContent = fs.readFileSync('packages/ui/src/components/Sidebar.svelte', 'utf8');
sideContent = sideContent.replace(
  "    const localeVal = getLocale();\n\n    Promise.all",
  "    const localeVal = getLocale();\n    let cancelled = false;\n\n    Promise.all"
);
sideContent = sideContent.replace(
  "      const items: NavItem[] = [{ path: '/', label: t('common.home'), Icon: LayoutDashboard }];",
  "      if (cancelled) return;\n      const items: NavItem[] = [{ path: '/', label: t('common.home'), Icon: LayoutDashboard }];"
);
sideContent = sideContent.replace(
  "      navItems = items;\n    });\n  });",
  "      navItems = items;\n    });\n\n    return () => { cancelled = true; };\n  });"
);
fs.writeFileSync('packages/ui/src/components/Sidebar.svelte', sideContent);
