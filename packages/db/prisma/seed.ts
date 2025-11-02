import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@promptstash.dev' },
    update: {},
    create: {
      id: 'demo-user-id',
      name: 'Demo User',
      email: 'demo@promptstash.dev',
      emailVerified: true,
    },
  });

  console.log('✅ Created demo user:', user.email);

  // Create a demo stash
  const stash = await prisma.stash.upsert({
    where: { id: 'demo-stash-id' },
    update: {},
    create: {
      id: 'demo-stash-id',
      name: 'My PromptStash',
      scope: 'USER',
      description: 'A collection of Claude Code context files',
      userId: user.id,
    },
  });

  console.log('✅ Created demo stash:', stash.name);

  // Create root folder
  const rootFolder = await prisma.folder.upsert({
    where: { id: 'demo-root-folder' },
    update: {},
    create: {
      id: 'demo-root-folder',
      name: 'Root',
      path: '/',
      stashId: stash.id,
      rootStashId: stash.id,
    },
  });

  console.log('✅ Created root folder');

  // Create a components folder
  const componentsFolder = await prisma.folder.upsert({
    where: { id: 'demo-components-folder' },
    update: {},
    create: {
      id: 'demo-components-folder',
      name: 'components',
      path: '/components',
      parentId: rootFolder.id,
      stashId: stash.id,
    },
  });

  console.log('✅ Created components folder');

  // Create some demo files
  const claudeFile = await prisma.file.create({
    data: {
      name: 'CLAUDE.md',
      path: '/CLAUDE.md',
      content: `# Project Context

This is a demo PromptStash file that contains context for Claude Code.

## Tech Stack
- Next.js 16
- React 19
- TypeScript
- Prisma ORM
- PostgreSQL

## Conventions
- Use functional components with hooks
- Follow ESLint rules
- Write tests for critical functionality
`,
      fileType: 'MARKDOWN',
      folderId: rootFolder.id,
      stashId: stash.id,
    },
  });

  console.log('✅ Created demo file:', claudeFile.name);

  const buttonContext = await prisma.file.create({
    data: {
      name: 'Button.md',
      path: '/components/Button.md',
      content: `# Button Component Context

The Button component uses shadcn/ui and supports multiple variants.

## Usage
\`\`\`tsx
<Button variant="default">Click me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
\`\`\`

## Props
- variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
- size: "default" | "sm" | "lg" | "icon"
- asChild: boolean
`,
      fileType: 'MARKDOWN',
      folderId: componentsFolder.id,
      stashId: stash.id,
    },
  });

  console.log('✅ Created button context file:', buttonContext.name);

  // Create some tags
  const reactTag = await prisma.tag.create({
    data: {
      name: 'react',
      color: '#61DAFB',
    },
  });

  const uiTag = await prisma.tag.create({
    data: {
      name: 'ui',
      color: '#8B5CF6',
    },
  });

  console.log('✅ Created tags');

  // Tag the button context file
  await prisma.fileTag.create({
    data: {
      fileId: buttonContext.id,
      tagId: reactTag.id,
    },
  });

  await prisma.fileTag.create({
    data: {
      fileId: buttonContext.id,
      tagId: uiTag.id,
    },
  });

  console.log('✅ Tagged button context file');

  // Create a file version
  await prisma.fileVersion.create({
    data: {
      fileId: claudeFile.id,
      content: claudeFile.content,
      version: 1,
      createdBy: user.id,
    },
  });

  console.log('✅ Created initial file version');

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('Demo user credentials:');
  console.log('  Email: demo@promptstash.dev');
  console.log('  (Note: This is for reference only. Set up authentication to use.)\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
