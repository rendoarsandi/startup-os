import { Generator, getConfig } from '@tanstack/router-generator';
import path from 'path';

async function main() {
  const config = getConfig({
    routesDirectory: './src/routes',
    generatedRouteTree: './src/routeTree.gen.ts'
  }, path.resolve('.'));
  
  const generator = new Generator({ config, root: path.resolve('.') });
  await generator.run();
  console.log('Route tree generated successfully!');
}

main().catch(console.error);
