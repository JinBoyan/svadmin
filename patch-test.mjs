import fs from 'fs';
let c = fs.readFileSync('packages/pocketbase/src/pocketbase.test.ts', 'utf8');
c = c.replace(/expect\(mockCollection\.unsubscribe\)\.toHaveBeenCalledWith\('\*'\);/g, "expect(mockCollection.unsubscribe).toHaveBeenCalledWith('*', expect.any(Function));");
fs.writeFileSync('packages/pocketbase/src/pocketbase.test.ts', c);
