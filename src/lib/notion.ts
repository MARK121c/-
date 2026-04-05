import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_SECRET,
});

export const addExpense = async (amount: number, description: string) => {
  if (!process.env.NOTION_SECRET || !process.env.FINANCE_DB_ID) return;
  
  await notion.pages.create({
    parent: { database_id: process.env.FINANCE_DB_ID },
    properties: {
      Name: {
        title: [
          {
            text: { content: description },
          },
        ],
      },
      Amount: {
        number: amount,
      },
      Date: {
        date: { start: new Date().toISOString() },
      },
      Category: {
        select: { name: 'Telegram' },
      },
    },
  });
};

export const addTask = async (taskName: string) => {
  if (!process.env.NOTION_SECRET || !process.env.TASKS_DB_ID) return;

  await notion.pages.create({
    parent: { database_id: process.env.TASKS_DB_ID },
    properties: {
      'Task Name': {
        title: [
          {
            text: { content: taskName },
          },
        ],
      },
      Status: {
        status: { name: 'Not started' },
      },
      'Due Date': {
        date: { start: new Date().toISOString() },
      },
    },
  });
};

export const addAsset = async (link: string) => {
  if (!process.env.NOTION_SECRET || !process.env.ASSETS_DB_ID) return;

  await notion.pages.create({
    parent: { database_id: process.env.ASSETS_DB_ID },
    properties: {
      Name: {
        title: [
          {
            text: { content: link },
          },
        ],
      },
    },
  });
};

// Robust fetch helper that tries both database.query and dataSources.query
export const robustQuery = async (id: string, options: any) => {
  try {
    // Try dataSources first (new standard in v5.x)
    return await (notion as any).dataSources.query({
      data_source_id: id,
      ...options,
    });
  } catch (e) {
    // Fallback to databases
    return await notion.databases.query({
      database_id: id,
      ...options,
    });
  }
};
