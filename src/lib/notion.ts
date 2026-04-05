import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_SECRET,
});

export const addExpense = async (amount: number, description: string) => {
  if (!process.env.FINANCE_DB_ID) throw new Error('Missing FINANCE_DB_ID');
  
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
        select: { name: 'Uncategorized' },
      },
    },
  });
};

export const addTask = async (taskName: string) => {
  if (!process.env.TASKS_DB_ID) throw new Error('Missing TASKS_DB_ID');

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
  if (!process.env.ASSETS_DB_ID) throw new Error('Missing ASSETS_DB_ID');

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

export const getFinances = async () => {
  if (!process.env.FINANCE_DB_ID) return [];
  
  const response = await notion.databases.query({
    database_id: process.env.FINANCE_DB_ID,
    sorts: [{ property: 'Date', direction: 'descending' }],
    page_size: 100,
  });

  return response.results.map((page: any) => ({
    id: page.id,
    name: page.properties.Name?.title[0]?.plain_text || 'Unknown',
    amount: page.properties.Amount?.number || 0,
    date: page.properties.Date?.date?.start || 'Unknown',
    category: page.properties.Category?.select?.name || 'Empty',
  }));
};

export const getTasks = async () => {
  if (!process.env.TASKS_DB_ID) return [];

  const response = await notion.databases.query({
    database_id: process.env.TASKS_DB_ID,
    filter: {
      property: 'Status',
      status: {
        does_not_equal: 'Done',
      },
    },
    sorts: [{ property: 'Due Date', direction: 'ascending' }],
  });

  return response.results.map((page: any) => ({
    id: page.id,
    name: page.properties['Task Name']?.title[0]?.plain_text || 'Unnamed Task',
    status: page.properties.Status?.status?.name || 'Unknown',
    dueDate: page.properties['Due Date']?.date?.start || null,
  }));
};
