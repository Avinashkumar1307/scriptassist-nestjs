import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../../modules/users/entities/user.entity';
import { Task } from '../../modules/tasks/entities/task.entity';
import { users } from './seed-data/users.seed';
import { tasks } from './seed-data/tasks.seed';

// Load environment variables
config();

// Define the data source
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'taskflow',
  entities: [User, Task],
  synchronize: false,
});

// Initialize and seed database
async function main() {
  try {
    // Initialize connection
    await AppDataSource.initialize();
    console.log('Database connection initialized');

    // Option 1: Using query builder to delete all records
    console.log('Clearing existing data...');
    await AppDataSource.createQueryBuilder()
      .delete()
      .from(Task)
      .where('id IS NOT NULL')
      .execute();

    await AppDataSource.createQueryBuilder()
      .delete()
      .from(User)
      .where('id IS NOT NULL')
      .execute();

    // Option 2: Alternative using raw query with CASCADE
    // await AppDataSource.query('TRUNCATE TABLE users, tasks CASCADE');

    console.log('Existing data cleared');

    // Seed users first since tasks reference users
    console.log('Seeding users...');
    const createdUsers = await AppDataSource.getRepository(User).save(users);
    console.log(`${createdUsers.length} users seeded successfully`);

    // Seed tasks
    console.log('Seeding tasks...');
    const createdTasks = await AppDataSource.getRepository(Task).save(tasks);
    console.log(`${createdTasks.length} tasks seeded successfully`);

    console.log('✅ Database seeding completed');
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
  } finally {
    // Close connection
    await AppDataSource.destroy();
    console.log('Database connection closed');
  }
}

// Run the seeding
main();