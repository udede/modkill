import inquirer from 'inquirer';

export async function confirmDeletion(count: number): Promise<boolean> {
  const { confirm } = await inquirer.prompt([
    { type: 'confirm', name: 'confirm', message: `Delete ${count} folders?`, default: false },
  ]);
  return !!confirm;
}

